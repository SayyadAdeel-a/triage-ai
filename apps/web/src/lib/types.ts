export interface EmailData {
  id: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  summary: string;
  originalBody?: string | null;
  category: string;
  draftReply?: string | null;
  confidenceScore?: number;
  priority?: number;
  replyNeeded?: boolean;
  providerMessageId?: string;
  time: string;
}
