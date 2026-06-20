import { z } from "zod";

export const emailResponseSchema = z.object({
  emails: z.array(z.object({
    id: z.string(),
    subject: z.string().optional().default("No Subject"),
    senderName: z.string().optional().default("Unknown Sender"),
    senderEmail: z.string().optional().default("unknown@example.com"),
    category: z.string().optional().default("Ignore"),
    priority: z.number().int().min(1).max(5).optional().default(1),
    replyNeeded: z.boolean().optional().default(false),
    confidenceScore: z.number().int().min(0).max(100).optional().default(0),
    summary: z.string().optional().default("No summary provided"),
    draftReply: z.string().nullable().optional().default(null),
  }))
});

export const linkedInResponseSchema = z.object({
  subject: z.string().optional().default("Conversation"),
  category: z.string().optional().default("Ignore"),
  priority: z.number().int().min(1).max(5).optional().default(1),
  replyNeeded: z.boolean().optional().default(false),
  confidenceScore: z.number().int().min(0).max(100).optional().default(0),
  summary: z.string().optional().default("No summary"),
  draftReply: z.string().nullable().optional().default(null),
});

export function parseJsonResponse<T>(text: string, schema: z.ZodSchema<T>): T {
  let parsed: any;

  try {
    parsed = JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not extract JSON from AI response.");
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      const balancedMatch = extractBalancedJson(text);
      if (!balancedMatch) throw new Error("Could not parse JSON from AI response.");
      parsed = JSON.parse(balancedMatch);
    }
  }

  return schema.parse(parsed);
}

function extractBalancedJson(text: string): string | null {
  const start = text.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < text.length; i++) {
    const char = text[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (char === '\\' && inString) {
      escape = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === '{') depth++;
    else if (char === '}') {
      depth--;
      if (depth === 0) {
        return text.substring(start, i + 1);
      }
    }
  }

  return null;
}

export function redactSecrets(text: string): string {
  let redacted = text;
  redacted = redacted.replace(/https?:\/\/[^\s>]+(?:reset|token|verify|otp|magic|auth)[^\s>]+/gi, "[REDACTED_SECURE_LINK]");
  redacted = redacted.replace(/(?:Bearer\s+|api_key[\s=:]+|token[\s=:]+)[A-Za-z0-9_.-]{20,}/gi, "$1[REDACTED_SECRET]");
  redacted = redacted.replace(/(?:code|otp|pin|verification)[\s:=]+(\d{4,8})/gi, (match: string, p1: string) => match.replace(p1, "[REDACTED_OTP]"));
  redacted = redacted.replace(/(?:password is|pwd:)[\s*]+([^\s]+)/gi, (match: string, p1: string) => match.replace(p1, "[REDACTED_PASSWORD]"));
  return redacted;
}

export function applyDeterministicFilters(text: string): string {
  const emailBlocks = text.split('━━━ [');
  const processedBlocks = emailBlocks.map((block: string) => {
    if (!block.trim()) return block;

    let aiBlock = block;
    if (aiBlock.length > 2000) {
      aiBlock = aiBlock.substring(0, 2000) + "\n...[TRUNCATED FOR AI]";
    }

    const lowerBlock = aiBlock.toLowerCase();
    const isMarketing = lowerBlock.includes('unsubscribe') ||
                        lowerBlock.includes('view in browser') ||
                        lowerBlock.includes('manage preferences') ||
                        lowerBlock.includes('opt out');
    if (isMarketing) {
      return block.replace(/From:\s+[^\n]+/, (match) => `${match}\nDETERMINISTIC SIGNAL: This email contains a mass-mailing footprint (e.g. 'unsubscribe'). It NEVER 'Needs Reply'. Usually, classify as 'Newsletters' or 'Promotions'. HOWEVER, if it's a Google Security/Account Alert, classify as 'Google Alerts'. If it mentions the user's products (e.g. 'Tenreq'), classify as 'Important'. If it is a transactional receipt/confirmation, classify as 'Notifications'.`);
    }
    return block;
  });
  return processedBlocks.join('━━━ [');
}

export function extractBodyMap(text: string): Map<string, string> {
  const bodyMap = new Map<string, string>();
  const rawBlocks = text.split('━━━ [');
  for (const block of rawBlocks) {
    if (!block.trim()) continue;
    const endIdx = block.indexOf(']');
    if (endIdx !== -1) {
      const id = block.substring(0, endIdx);
      const content = block.substring(endIdx + 1).trim();
      bodyMap.set(id, content);
    }
  }
  return bodyMap;
}
