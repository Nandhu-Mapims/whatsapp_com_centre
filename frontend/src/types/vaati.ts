export type VaatiMessageType = 'text' | 'url_text' | 'image_text' | 'pdf_text' | 'poll';

export interface VaatiVariable {
  key: string;
  description?: string;
  sampleValue?: string;
}

export interface VaatiTemplate {
  id: string;
  name: string;
  title: string;
  category: string;
  messageType?: VaatiMessageType;
  header?: string;
  body: string;
  footer?: string;
  ctaUrl?: string;
  mediaUrl?: string;
  mediaFilename?: string;
  mediaMimetype?: string;
  pollOptions?: string[];
  multipleAnswers?: boolean;
  allowReplies?: boolean;
  replyPrompt?: string;
  variables: VaatiVariable[];
  status: 'ACTIVE' | 'ARCHIVED';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface VaatiReplyRecord {
  replyId: string;
  waMessageId: string;
  session: string;
  senderPhone: string;
  senderChatId: string;
  senderName: string;
  employeeId?: string;
  department?: string;
  designation?: string;
  templateId: string;
  templateName: string;
  templateTitle: string;
  campaignId?: string;
  campaignTitle?: string;
  questionText: string;
  outboundWaMessageId?: string;
  replyType: 'text' | 'poll_vote' | 'media';
  replyText: string;
  selectedOptions?: string[];
  hasMedia: boolean;
  mediaType?: string;
  quotedMatch: boolean;
  repliedAt: string;
  status: 'NEW' | 'REVIEWED';
  adminNote?: string;
}
