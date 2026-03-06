/**
 * Minimal SMTP client for Deno using raw TLS connections.
 * Supports direct TLS (port 465) only.
 * Implements: EHLO, AUTH LOGIN, MAIL FROM, RCPT TO, DATA, QUIT.
 */

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
}

export class SmtpClient {
  private conn!: Deno.Conn;
  private decoder = new TextDecoder();
  private encoder = new TextEncoder();

  async connect(config: SmtpConfig): Promise<void> {
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

    // Read server greeting (220)
    await this.readReply(220);

    // EHLO
    await this.sendCommand(`EHLO polsya-crm`, 250);

    // AUTH LOGIN
    await this.sendCommand('AUTH LOGIN', 334);
    await this.sendCommand(btoa(config.username), 334);
    await this.sendCommand(btoa(config.password), 235);
  }

  async sendMail(
    from: string,
    to: string[],
    cc: string[],
    bcc: string[],
    mimeMessage: string,
  ): Promise<void> {
    // MAIL FROM
    await this.sendCommand(`MAIL FROM:<${from}>`, 250);

    // RCPT TO — all recipients
    for (const addr of [...to, ...cc, ...bcc]) {
      await this.sendCommand(`RCPT TO:<${addr}>`, 250);
    }

    // DATA
    await this.sendCommand('DATA', 354);

    // Send message body, ensuring lines starting with . are escaped
    const escaped = mimeMessage.replace(/\r\n\./g, '\r\n..');
    await this.conn.write(this.encoder.encode(escaped + '\r\n.\r\n'));

    // Read final 250 OK
    await this.readReply(250);
  }

  async quit(): Promise<void> {
    try {
      await this.sendCommand('QUIT', 221);
    } catch {
      // Ignore quit errors
    }
  }

  close(): void {
    try {
      this.conn.close();
    } catch {
      // Ignore
    }
  }

  // ── Private helpers ──────────────────────────────────────────────────

  private async sendCommand(
    command: string,
    expectedCode: number,
  ): Promise<string> {
    await this.conn.write(this.encoder.encode(command + '\r\n'));
    return this.readReply(expectedCode);
  }

  /**
   * Read SMTP reply lines until we get a line matching `CODE SP` (final line).
   * Multi-line replies use `CODE-` for continuation.
   */
  private async readReply(expectedCode: number): Promise<string> {
    let response = '';
    const buf = new Uint8Array(4096);

    while (true) {
      const n = await this.conn.read(buf);
      if (n === null) {
        throw new Error(`SMTP connection closed unexpectedly: ${response}`);
      }
      response += this.decoder.decode(buf.subarray(0, n));

      // Check for final reply line: "CODE SP..."
      const lines = response.split('\r\n');
      const lastComplete = lines.filter((l) => l.length >= 4);
      const finalLine = lastComplete.find(
        (l) => /^\d{3} /.test(l),
      );

      if (finalLine) {
        const code = parseInt(finalLine.substring(0, 3), 10);
        if (code !== expectedCode) {
          throw new Error(
            `SMTP error: expected ${expectedCode}, got ${code}: ${response.trim()}`,
          );
        }
        return response;
      }
    }
  }
}
