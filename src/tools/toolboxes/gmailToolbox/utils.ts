import { gmail_v1 } from "googleapis";
import { gmailConfig } from '../../../config.js'

export function parseEmail(message: gmail_v1.Schema$Message) {

  if (! message.payload) {
      throw new Error("No payload found in message")
  }
  const headers = message.payload.headers;

  if (!headers) {
    throw new Error("No headers found")
  }

  const get = (name: string) => headers.find((h) => h.name === name)?.value ?? null;

  let body = '';
  const parts = message.payload.parts ?? [message.payload];

  for (const part of parts) {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      body = Buffer.from(part.body.data, 'base64').toString('utf-8');
      break;
    }
  }

  return {
    id: message.id,
    threadId: message.threadId,
    subject: get('Subject'),
    from: get('From'),
    to: get('To'),
    date: get('Date'),
    snippet: message.snippet,
    body,
    labelIds: message.labelIds ?? [],
  };
}

export function encodeEmail(to: string, subject: string, body: string, replyToMessageId?: string, threadId?: string) {
  const lines = [
    `To: ${to}`,
    'Content-Type: text/plain; charset=utf-8',
    `Subject: ${subject}`,
  ];

  if (replyToMessageId) {
    lines.push(`In-Reply-To: ${replyToMessageId}`);
    lines.push(`References: ${replyToMessageId}`);
  }

  lines.push('', body);
  lines.push(`\n-- ${gmailConfig.agentSignoff}`)

  return Buffer.from(lines.join('\n')).toString('base64url');
}