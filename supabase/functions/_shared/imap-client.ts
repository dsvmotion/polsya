/**
 * Minimal IMAP client for Deno using raw TLS connections.
 * Implements only the subset needed for email sync:
 * LOGIN, SELECT, SEARCH, FETCH, LOGOUT.
 */

export interface ImapConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
}

export interface ImapFetchedMessage {
  /** Sequence number from FETCH */
  seq: string;
  /** Raw email headers as text */
  rawHeaders: string;
  /** Parsed header map (lowercase keys) */
  headers: Record<string, string>;
  /** Body text content */
  bodyText: string;
  /** FLAGS from the server */
  flags: string[];
}

export class ImapClient {
  private conn!: Deno.Conn;
  private decoder = new TextDecoder();
  private encoder = new TextEncoder();
  private tagNum = 0;
  private buffer = '';

  /**
   * Connect to IMAP server.
   * For port 993 use secure=true (direct TLS).
   * For port 143 use secure=false (plaintext; STARTTLS not implemented).
   */
  async connect(config: ImapConfig): Promise<void> {
    if (config.secure) {
      this.conn = await Deno.connectTls({
        hostname: config.host,
        port: config.port,
      });
    } else {
      this.conn = await Deno.connect({
        hostname: config.host,
        port: config.port,
      });
    }
    // Read server greeting (untagged * OK ...)
    await this.readUntilLine((line) => line.startsWith('* '));
  }

  async login(username: string, password: string): Promise<void> {
    const u = username.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const p = password.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    await this.command(`LOGIN "${u}" "${p}"`);
  }

  async selectInbox(): Promise<void> {
    await this.command('SELECT INBOX');
  }

  async searchSince(since: Date): Promise<string[]> {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const dateStr = `${since.getDate()}-${months[since.getMonth()]}-${since.getFullYear()}`;
    const resp = await this.command(`SEARCH SINCE ${dateStr}`);
    const match = resp.match(/\* SEARCH ([\d ]+)/);
    if (!match) return [];
    return match[1].trim().split(/\s+/);
  }

  async fetchMessage(seqNum: string): Promise<ImapFetchedMessage | null> {
    if (!/^\d+$/.test(seqNum)) {
      throw new Error(`Invalid IMAP sequence number: ${seqNum}`);
    }
    const resp = await this.command(
      `FETCH ${seqNum} (FLAGS RFC822.HEADER BODY[TEXT])`,
    );

    // Parse FLAGS
    const flagsMatch = resp.match(/FLAGS \(([^)]*)\)/);
    const flags = flagsMatch
      ? flagsMatch[1].split(/\s+/).filter(Boolean)
      : [];

    // Extract RFC822.HEADER literal: {N}\r\n followed by N chars
    const rawHeaders = this.extractLiteral(resp, 'RFC822.HEADER');

    // Extract BODY[TEXT] literal
    const bodyText = this.extractLiteral(resp, 'BODY[TEXT]');

    if (!rawHeaders) return null;

    // Parse headers into key-value map
    const headers = this.parseHeaders(rawHeaders);

    return { seq: seqNum, rawHeaders, headers, bodyText, flags };
  }

  async logout(): Promise<void> {
    try {
      await this.command('LOGOUT');
    } catch {
      // Ignore errors during logout
    }
  }

  close(): void {
    try {
      this.conn.close();
    } catch {
      // Ignore
    }
  }

  // -- Private helpers ----------------------------------------------------

  private nextTag(): string {
    return `T${++this.tagNum}`;
  }

  /**
   * Send a tagged command and read the full response until the tagged
   * completion line (OK, NO, or BAD).
   */
  private async command(cmd: string): Promise<string> {
    const tag = this.nextTag();
    const line = `${tag} ${cmd}\r\n`;
    await this.conn.write(this.encoder.encode(line));

    let response = '';
    const tagPattern = new RegExp(`(^|\\r\\n)${tag} (OK|NO|BAD)`);

    while (true) {
      const chunk = await this.readChunk();
      if (chunk === '') {
        throw new Error('IMAP connection closed unexpectedly');
      }
      response += chunk;

      // Check if we've received the tagged completion
      // It must be at the start of a line: \r\nTAG OK/NO/BAD or at the very start
      const m = response.match(tagPattern);
      if (m) {
        if (m[2] === 'NO' || m[2] === 'BAD') {
          throw new Error(`IMAP ${m[2]}: ${response.trim()}`);
        }
        break;
      }
    }

    return response;
  }

  /**
   * Read data from connection, combining with any buffered remainder.
   * Returns at least one chunk of data.
   */
  private async readChunk(): Promise<string> {
    if (this.buffer.length > 0) {
      const data = this.buffer;
      this.buffer = '';
      return data;
    }
    const buf = new Uint8Array(65536);
    const n = await this.conn.read(buf);
    if (n === null) return '';
    return this.decoder.decode(buf.subarray(0, n));
  }

  /**
   * Read until we find a line matching the predicate.
   * Used for reading server greeting.
   */
  private async readUntilLine(
    predicate: (line: string) => boolean,
  ): Promise<string> {
    let data = '';
    while (true) {
      const chunk = await this.readChunk();
      if (chunk === '') {
        throw new Error('IMAP connection closed before expected response');
      }
      data += chunk;
      const lines = data.split('\r\n');
      for (const line of lines) {
        if (predicate(line)) return data;
      }
    }
  }

  /**
   * Extract a literal value from an IMAP response.
   * Looks for `fieldName {N}\r\n` followed by N characters of data.
   */
  private extractLiteral(response: string, fieldName: string): string {
    // Match field followed by literal length indicator
    const pattern = new RegExp(
      `${fieldName.replace(/[[\]]/g, '\\$&')}\\s+\\{(\\d+)\\}\\r\\n`,
    );
    const match = response.match(pattern);
    if (!match) return '';

    const length = parseInt(match[1], 10);
    const startIdx = response.indexOf(match[0]) + match[0].length;
    return response.substring(startIdx, startIdx + length);
  }

  /**
   * Parse raw email headers into a lowercase key -> value map.
   * Handles multi-line header folding.
   */
  private parseHeaders(raw: string): Record<string, string> {
    const headers: Record<string, string> = {};
    const lines = raw.split(/\r?\n/);
    let currentKey = '';

    for (const line of lines) {
      if (!line) continue;
      const kvMatch = line.match(/^([A-Za-z-]+):\s*(.*)/);
      if (kvMatch) {
        currentKey = kvMatch[1].toLowerCase();
        headers[currentKey] = kvMatch[2];
      } else if (currentKey && (line.startsWith(' ') || line.startsWith('\t'))) {
        headers[currentKey] += ' ' + line.trim();
      }
    }

    return headers;
  }
}
