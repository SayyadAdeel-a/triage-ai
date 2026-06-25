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
  isRead?: boolean;
  providerMessageId?: string;
  time: string;
  labels?: string;
}
