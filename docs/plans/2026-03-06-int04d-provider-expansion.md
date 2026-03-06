# INT-04D: Provider Expansion (IMAP Sync + SMTP Send) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the IMAP email sync and SMTP email send paths so all three email providers (Gmail, Outlook, IMAP/SMTP) have full read + send capabilities.

**Architecture:** Add two shared helper modules (`imap-client.ts`, `smtp-client.ts`) using `Deno.connectTls()` for raw protocol communication. Wire them into the existing `email-sync` and `email-send` edge functions at the exact locations where IMAP/SMTP support is deferred (line 147 in email-sync, line 139 in email-send).

**Tech Stack:** Deno runtime, raw IMAP/SMTP over TLS via `Deno.connectTls()`, existing Supabase edge function infrastructure.

**Note:** These are Deno edge functions — the project's vitest suite is for the React frontend only. Verification is via `deno check` for type safety + manual testing with a real IMAP/SMTP server. If `Deno.connectTls()` is unavailable in Supabase Edge Functions, fallback to `npm:imapflow` + `npm:nodemailer` via Deno's npm compat layer.

---

### Task 1: Create shared IMAP client helper

**Files:**
- Create: `supabase/functions/_shared/imap-client.ts`

**Step 1: Create the IMAP client module**

```typescript
// supabase/functions/_shared/imap-client.ts

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

  // ── Private helpers ──────────────────────────────────────────────────

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

    while (true) {
      const chunk = await this.readChunk();
      response += chunk;

      // Check if we've received the tagged completion
      // It must be at the start of a line: \r\nTAG OK/NO/BAD or at the very start
      const tagPattern = new RegExp(`(^|\\r\\n)${tag} (OK|NO|BAD)`);
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
   * Parse raw email headers into a lowercase key → value map.
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
```

**Step 2: Commit**

```bash
git add supabase/functions/_shared/imap-client.ts
git commit -m "feat(int04d): add minimal IMAP client helper for Deno edge functions"
```

---

### Task 2: Wire IMAP sync into email-sync

**Files:**
- Modify: `supabase/functions/email-sync/index.ts:1-4` (add import)
- Modify: `supabase/functions/email-sync/index.ts:146-147` (wire IMAP branch)
- Add new function `fetchImapMessages()` after the Outlook section (~line 443)

**Step 1: Add import at top of file**

At line 4, after the existing imports, add:

```typescript
import { ImapClient } from '../_shared/imap-client.ts';
```

**Step 2: Wire IMAP into the provider branch**

Replace line 147:
```typescript
      // IMAP sync deferred to future iteration
```

With:
```typescript
      else if (integration.provider === 'email_imap') {
        messages = await fetchImapMessages(metadata, sinceDate);
      }
```

**Step 3: Add fetchImapMessages function**

Insert after the `parseOutlookMessage` function (after line 443), before the Entity auto-matching section:

```typescript
// ---------------------------------------------------------------------------
// IMAP fetch
// ---------------------------------------------------------------------------

async function fetchImapMessages(
  metadata: Record<string, unknown>,
  since: Date,
): Promise<RawEmail[]> {
  const host = metadata.imap_host as string;
  const port = (metadata.imap_port as number) ?? 993;
  const secure = (metadata.imap_secure as boolean) ?? true;
  const username = metadata.username as string;
  const password = metadata.password as string;
  const accountEmail = (metadata.account_email as string) ?? '';

  if (!host || !username || !password) return [];

  const client = new ImapClient();

  try {
    await client.connect({ host, port, secure, username, password });
    await client.login(username, password);
    await client.selectInbox();

    const seqNums = await client.searchSince(since);
    if (!seqNums.length) return [];

    // Cap at 50 per sync cycle (consistent with Gmail/Outlook)
    const capped = seqNums.slice(-50);
    const results: RawEmail[] = [];

    for (const seq of capped) {
      try {
        const msg = await client.fetchMessage(seq);
        if (!msg) continue;

        const parsed = parseImapMessage(msg, accountEmail);
        if (parsed) results.push(parsed);
      } catch (err) {
        logEdgeEvent('warn', {
          fn: FN,
          error: `IMAP fetch seq ${seq}: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    }

    await client.logout();
    return results;
  } finally {
    client.close();
  }
}

function parseImapMessage(
  msg: { seq: string; headers: Record<string, string>; bodyText: string; flags: string[] },
  accountEmail: string,
): RawEmail | null {
  const fromRaw = msg.headers['from'] ?? '';
  const toRaw = msg.headers['to'] ?? '';
  const ccRaw = msg.headers['cc'] ?? '';
  const subject = msg.headers['subject'] ?? null;
  const dateRaw = msg.headers['date'] ?? '';
  const messageId = msg.headers['message-id']?.replace(/[<>]/g, '') ?? msg.seq;

  const fromParsed = parseEmailHeader(fromRaw);
  const toParsed = parseEmailList(toRaw);
  const ccParsed = parseEmailList(ccRaw);

  const fromEmail = fromParsed.email.toLowerCase();
  const direction: 'inbound' | 'outbound' =
    accountEmail && fromEmail === accountEmail.toLowerCase() ? 'outbound' : 'inbound';

  // Determine if body is HTML or plain text
  const isHtml = msg.bodyText.includes('<html') || msg.bodyText.includes('<div') || msg.bodyText.includes('<p');
  const bodyHtml = isHtml ? msg.bodyText : undefined;
  const bodyText = isHtml ? undefined : msg.bodyText;

  // Generate snippet from body (first 200 chars, text only)
  const snippetSource = bodyText ?? msg.bodyText.replace(/<[^>]+>/g, '');
  const snippet = snippetSource.substring(0, 200).trim() || undefined;

  const sentAt = dateRaw ? new Date(dateRaw).toISOString() : new Date().toISOString();

  return {
    messageId,
    subject,
    fromAddress: fromParsed.email,
    fromName: fromParsed.name || undefined,
    toAddresses: toParsed,
    ccAddresses: ccParsed.length > 0 ? ccParsed : undefined,
    bodyText,
    bodyHtml,
    snippet,
    labels: [],
    isRead: msg.flags.includes('\\Seen'),
    isStarred: msg.flags.includes('\\Flagged'),
    isDraft: msg.flags.includes('\\Draft'),
    direction,
    sentAt,
    hasAttachments: false, // Cannot reliably detect from TEXT-only fetch
  };
}
```

**Step 4: Commit**

```bash
git add supabase/functions/email-sync/index.ts
git commit -m "feat(int04d): add IMAP email sync path in email-sync edge function"
```

---

### Task 3: Create shared SMTP client helper

**Files:**
- Create: `supabase/functions/_shared/smtp-client.ts`

**Step 1: Create the SMTP client module**

```typescript
// supabase/functions/_shared/smtp-client.ts

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
      if (n === null) break;
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

    throw new Error(`SMTP connection closed unexpectedly: ${response}`);
  }
}
```

**Step 2: Commit**

```bash
git add supabase/functions/_shared/smtp-client.ts
git commit -m "feat(int04d): add minimal SMTP client helper for Deno edge functions"
```

---

### Task 4: Wire SMTP send into email-send + fix from_address

**Files:**
- Modify: `supabase/functions/email-send/index.ts:1-5` (add import)
- Modify: `supabase/functions/email-send/index.ts:138-139` (replace 501 with SMTP path)
- Modify: `supabase/functions/email-send/index.ts:155` (fix from_address for email_imap)
- Add new function `sendViaSmtp()` after the Outlook section (~line 265)

**Step 1: Add import**

After line 5 (`import { resolveCredentials }...`), add:

```typescript
import { SmtpClient } from '../_shared/smtp-client.ts';
```

**Step 2: Replace 501 response with SMTP path**

Replace lines 138-139:
```typescript
    } else {
      return jsonResponse({ error: 'SMTP send not yet supported' }, 501, origin);
    }
```

With:
```typescript
    } else if (integration.provider === 'email_imap') {
      sentMessageId = await sendViaSmtp(metadata, { to, cc, bcc, subject, bodyHtml, replyToMessageId });
    } else {
      return jsonResponse({ error: `Unsupported provider: ${integration.provider}` }, 501, origin);
    }
```

**Step 3: Fix from_address resolution for email_imap**

Replace line 155:
```typescript
      from_address: (metadata[`${integration.provider}_account_email`] as string) ?? '',
```

With:
```typescript
      from_address: integration.provider === 'email_imap'
        ? (metadata.account_email as string) ?? ''
        : (metadata[`${integration.provider}_account_email`] as string) ?? '',
```

**Step 4: Add sendViaSmtp function**

Insert after the `sendViaOutlook` function (after line 265), before the Entity matching section:

```typescript
// ---------------------------------------------------------------------------
// SMTP send (for IMAP/SMTP provider)
// ---------------------------------------------------------------------------

async function sendViaSmtp(metadata: Record<string, unknown>, params: SendParams): Promise<string> {
  const smtpHost = metadata.smtp_host as string;
  const smtpPort = (metadata.smtp_port as number) ?? 465;
  const smtpSecure = (metadata.smtp_secure as boolean) ?? true;
  const username = metadata.username as string;
  const password = metadata.password as string;
  const accountEmail = (metadata.account_email as string) ?? '';

  if (!smtpHost || !username || !password) {
    throw new Error('SMTP credentials not configured');
  }

  const fromAddress = accountEmail || username;
  const mimeMessage = buildMimeMessage(fromAddress, params);

  const client = new SmtpClient();

  try {
    await client.connect({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      username,
      password,
    });

    await client.sendMail(
      fromAddress,
      params.to,
      params.cc ?? [],
      params.bcc ?? [],
      mimeMessage,
    );

    await client.quit();
  } finally {
    client.close();
  }

  // Generate a client-side message ID (SMTP doesn't return one in sendMail)
  return `smtp-sent-${Date.now()}`;
}
```

**Step 5: Commit**

```bash
git add supabase/functions/email-send/index.ts
git commit -m "feat(int04d): add SMTP email send path + fix from_address for IMAP provider"
```

---

### Task 5: Verify types and final commit

**Step 1: Run deno check on all modified files**

```bash
cd supabase/functions && deno check \
  _shared/imap-client.ts \
  _shared/smtp-client.ts \
  email-sync/index.ts \
  email-send/index.ts
```

Expected: No type errors.

**Step 2: Fix any type errors found**

If `Deno.connectTls` or `Deno.connect` aren't recognized, the function may need a `/// <reference lib="deno.ns" />` at the top of the helper files, or the `deno.json` config may need updating.

**Step 3: Verify frontend build still passes**

```bash
cd /Users/diegosanjuanvillanueva/Desktop/polsya && npm run build
```

Expected: Build succeeds (edge function changes don't affect frontend build).

**Step 4: Run existing test suite**

```bash
npm test -- --run
```

Expected: All 481+ tests pass (no frontend code was changed).

**Step 5: Final commit if any fixes were needed**

```bash
git add -A && git commit -m "fix(int04d): resolve type-check issues in IMAP/SMTP helpers"
```

---

## Fallback: npm compatibility approach

If `Deno.connectTls()` is not available in the Supabase Edge Functions runtime, replace the custom clients:

**IMAP alternative** — replace `_shared/imap-client.ts` with:
```typescript
import { ImapFlow } from 'npm:imapflow@1.0.164';
```

**SMTP alternative** — replace `_shared/smtp-client.ts` with:
```typescript
import { createTransport } from 'npm:nodemailer@6.9.13';
```

Both libraries handle protocol details internally and are battle-tested. The tradeoff is adding npm dependencies to the Deno edge function environment.

---

## Summary

| Task | File(s) | Action |
|------|---------|--------|
| 1 | `_shared/imap-client.ts` | Create — minimal IMAP client |
| 2 | `email-sync/index.ts` | Modify — add `fetchImapMessages()` + wire into provider branch |
| 3 | `_shared/smtp-client.ts` | Create — minimal SMTP client |
| 4 | `email-send/index.ts` | Modify — add `sendViaSmtp()` + fix `from_address` + replace 501 |
| 5 | All | Verify — deno check, frontend build, test suite |
