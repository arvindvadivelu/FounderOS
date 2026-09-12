/**
 * EXTERNAL DATA SANITIZER & PROMPT INJECTION SHIELD
 * 
 * Safely neutralizes untrusted inputs coming from external services (GitHub issues,
 * commit messages, Google Calendar descriptions, email bodies, subject lines).
 */

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/gi,
  /system\s*:\s*you\s+are/gi,
  /<\|im_start\|>/gi,
  /<\|im_end\|>/gi,
  /\[system\s*message\]/gi,
  /drop\s+table\s+/gi,
  /delete\s+from\s+/gi,
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript\s*:/gi,
  /on\w+\s*=\s*["'][^"']*["']/gi,
];

/**
 * Strips HTML tags, control characters, and known prompt injection signatures
 */
export function sanitizeExternalText(text: string | null | undefined, maxLength = 1000): string {
  if (!text || typeof text !== 'string') return '';

  // 1. Basic HTML tag stripping
  let cleaned = text.replace(/<[^>]*>?/gm, '');

  // 2. Normalize and strip control characters
  cleaned = cleaned.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, '');

  // 3. Neutralize active prompt injection signatures by escaping/redacting
  for (const pattern of INJECTION_PATTERNS) {
    cleaned = cleaned.replace(pattern, '[REDACTED_UNTRUSTED_INSTRUCTION]');
  }

  // 4. Truncate to maximum length
  if (cleaned.length > maxLength) {
    cleaned = cleaned.slice(0, maxLength) + '... [truncated]';
  }

  return cleaned.trim();
}

/**
 * Validates and sanitizes an external object record before writing to IndexedDB or AI context
 */
export function sanitizeExternalRecord<T extends Record<string, any>>(record: T): T {
  const result: any = Array.isArray(record) ? [] : {};

  for (const [key, val] of Object.entries(record)) {
    if (typeof val === 'string') {
      // Avoid redacting IDs or URLs completely, but sanitize text fields
      if (key === 'url' || key === 'id' || key === 'externalId') {
        result[key] = val.slice(0, 500);
      } else {
        result[key] = sanitizeExternalText(val);
      }
    } else if (val !== null && typeof val === 'object') {
      result[key] = sanitizeExternalRecord(val);
    } else {
      result[key] = val;
    }
  }

  return result as T;
}
