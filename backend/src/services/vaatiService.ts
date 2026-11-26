import { ENV } from '../config/env.js';
import { toWatiDigits } from '../utils/phoneUtils.js';

export type VaatiMessageType = 'text' | 'url_text' | 'image_text' | 'pdf_text' | 'poll';

export interface VaatiMessagePayload {
  whatsappNumber: string;
  text: string;
  linkPreview?: boolean;
  broadcastTitle?: string;
  session?: string;
}

export interface VaatiFilePayload {
  whatsappNumber: string;
  caption?: string;
  url?: string;
  data?: string;
  filename?: string;
  mimetype?: string;
  broadcastTitle?: string;
  session?: string;
}

export interface VaatiPollPayload {
  whatsappNumber: string;
  name: string;
  options: string[];
  multipleAnswers?: boolean;
  broadcastTitle?: string;
  session?: string;
}

export interface VaatiDispatchPayload {
  whatsappNumber: string;
  text: string;
  footer?: string;
  allowReplies?: boolean;
  replyPrompt?: string;
  messageType?: VaatiMessageType;
  ctaUrl?: string;
  mediaUrl?: string;
  mediaFilename?: string;
  mediaMimetype?: string;
  pollOptions?: string[];
  multipleAnswers?: boolean;
  broadcastTitle?: string;
  session?: string;
}

export class VaatiService {
  private static endpoint = (ENV as any).VAATI_API_ENDPOINT || 'https://3001-agq5mu2udnuf7vw22ngl3q4tnq.instabox.tech';
  private static apiKey = (ENV as any).VAATI_API_KEY || '1e7312becddd4c639d10688ec7267aa9';
  private static defaultSession = (ENV as any).VAATI_SESSION || 'tenant_efs';
  private static isVaatiEnabled: boolean = true;

  public static isEnabled(): boolean {
    return this.isVaatiEnabled;
  }

  public static setEnabled(enabled: boolean): void {
    this.isVaatiEnabled = enabled;
    console.log(`[VAATI Service] Gateway state changed: isEnabled = ${enabled}`);
  }

  /**
   * Health and status check for VAATI instance on the VPS
   */
  public static async getStatus(): Promise<{
    enabled: boolean;
    online: boolean;
    session: string;
    phone?: string;
    pushName?: string;
    connectedSessions?: Array<{ name: string; phone?: string; pushName?: string; status: string }>;
    error?: string;
  }> {
    if (!this.isVaatiEnabled) {
      return {
        enabled: false,
        online: false,
        session: this.defaultSession,
        error: 'VAATI gateway is turned OFF by admin.',
      };
    }

    try {
      const url = `${this.endpoint}/api/sessions`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Api-Key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return {
          enabled: true,
          online: false,
          session: this.defaultSession,
          error: `VAATI returned HTTP ${response.status}`,
        };
      }

      const sessions = (await response.json()) as any[];
      const workingSessions = sessions.filter((s) => s.status === 'WORKING');

      // Select active session: prefer configured defaultSession (tenant_efs), or first working session
      const primarySess =
        sessions.find((s) => s.name === this.defaultSession && s.status === 'WORKING') ||
        workingSessions[0] ||
        sessions.find((s) => s.name === this.defaultSession) ||
        sessions[0];

      if (!primarySess) {
        return {
          enabled: true,
          online: false,
          session: this.defaultSession,
          error: 'No WhatsApp sessions found in VAATI node.',
        };
      }

      const isOnline = primarySess.status === 'WORKING';
      const phone = primarySess.me?.id
        ? `+${primarySess.me.id.replace('@c.us', '').replace(/@.*/, '')}`
        : undefined;
      const pushName = primarySess.me?.pushName || undefined;

      const connectedList = workingSessions.map((s) => ({
        name: s.name,
        phone: s.me?.id ? `+${s.me.id.replace('@c.us', '').replace(/@.*/, '')}` : undefined,
        pushName: s.me?.pushName,
        status: s.status,
      }));

      return {
        enabled: true,
        online: isOnline,
        session: primarySess.name,
        phone,
        pushName,
        connectedSessions: connectedList,
      };
    } catch (err: any) {
      return {
        enabled: this.isVaatiEnabled,
        online: false,
        session: this.defaultSession,
        error: err.message,
      };
    }
  }

  /**
   * Shared VAATI HTTP POST helper for /api/sendText and /api/sendPoll
   */
  private static async postVaatiEndpoint(
    apiPath: string,
    whatsappNumber: string,
    requestedSession: string | undefined,
    buildBody: (session: string, chatId: string) => Record<string, any>
  ): Promise<{
    success: boolean;
    providerMessageId?: string;
    status: string;
    error?: string;
  }> {
    if (!this.isVaatiEnabled) {
      return {
        success: false,
        status: 'disabled',
        error: 'VAATI Gateway is currently turned OFF. Please enable VAATI or switch to WATI.',
      };
    }

    try {
      const cleanDigits = toWatiDigits(whatsappNumber);
      const chatId = `${cleanDigits}@c.us`;
      let session: string = requestedSession || '';
      if (!session) {
        const st = await this.getStatus();
        session = st.session || this.defaultSession;
      }
      const url = `${this.endpoint}${apiPath}`;
      const bodyPayload = buildBody(session, chatId);

      console.log(
        `[VAATI Service] Dispatching ${apiPath} to ${chatId} via session "${session}" (${url}):`,
        JSON.stringify(bodyPayload).slice(0, 140)
      );

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': this.apiKey,
        },
        body: JSON.stringify(bodyPayload),
      });

      const resData = (await response.json()) as any;

      if (response.ok && (resData.id || resData._data?.id)) {
        const msgId =
          resData.id?._serialized ||
          resData.id?.id ||
          resData._data?.id?._serialized ||
          resData._data?.id?.id ||
          `vaati_${Date.now()}`;

        return {
          success: true,
          providerMessageId: msgId,
          status: 'submitted',
        };
      } else {
        const errMsg = resData.message || resData.error || `HTTP ${response.status}: Failed to send via VAATI`;
        return {
          success: false,
          status: 'failed',
          error: errMsg,
        };
      }
    } catch (err: any) {
      console.error(`[VAATI Service] Error calling ${apiPath}:`, err.message);
      return {
        success: false,
        status: 'failed',
        error: err.message,
      };
    }
  }

  /**
   * Dispatch single direct text message to a WhatsApp number via VAATI (/api/sendText)
   */
  public static async sendTextMessage(payload: VaatiMessagePayload): Promise<{
    success: boolean;
    providerMessageId?: string;
    status: string;
    error?: string;
  }> {
    return this.postVaatiEndpoint('/api/sendText', payload.whatsappNumber, payload.session, (session, chatId) => ({
      session,
      chatId,
      text: payload.text,
      ...(payload.linkPreview ? { linkPreview: true } : {}),
    }));
  }

  /**
   * Dispatch Image or PDF with Caption via VAATI (/api/sendFile)
   * Automatically handles either remote HTTPS URLs or base64 data URIs from local file uploads.
   */
  public static async sendFileMessage(payload: VaatiFilePayload): Promise<{
    success: boolean;
    providerMessageId?: string;
    status: string;
    error?: string;
  }> {
    let rawUrl = (payload.url || '').trim();
    let rawData = (payload.data || '').trim();
    let mimetype = (payload.mimetype || '').trim();
    let filename = (payload.filename || '').trim();

    // Parse base64 data URI if uploaded from browser (e.g., data:application/pdf;base64,JVBER...)
    const dataUriMatch = rawUrl.match(/^data:([^;]+);base64,(.+)$/s);
    if (dataUriMatch) {
      mimetype = mimetype || dataUriMatch[1];
      rawData = dataUriMatch[2];
      rawUrl = '';
    }

    if (!rawData && !rawUrl) {
      return {
        success: false,
        status: 'failed',
        error: 'A valid file URL or uploaded file is required for media/PDF delivery.',
      };
    }

    if (!mimetype) {
      const lower = (filename || rawUrl).toLowerCase();
      mimetype = lower.endsWith('.pdf')
        ? 'application/pdf'
        : lower.endsWith('.png')
        ? 'image/png'
        : lower.endsWith('.webp')
        ? 'image/webp'
        : 'image/jpeg';
    }

    if (!filename) {
      filename = mimetype === 'application/pdf' ? 'document.pdf' : 'attachment.jpg';
    }

    const fileObj: Record<string, string> = { mimetype, filename };
    if (rawData) {
      fileObj.data = rawData;
    } else {
      fileObj.url = rawUrl;
    }

    return this.postVaatiEndpoint('/api/sendFile', payload.whatsappNumber, payload.session, (session, chatId) => ({
      session,
      chatId,
      file: fileObj,
      ...(payload.caption ? { caption: payload.caption } : {}),
    }));
  }

  /**
   * Dispatch 1-Tap Response Buttons (Yes/No or multi-option Poll) via VAATI (/api/sendPoll)
   */
  public static async sendPollMessage(payload: VaatiPollPayload): Promise<{
    success: boolean;
    providerMessageId?: string;
    status: string;
    error?: string;
  }> {
    const cleanOptions = (payload.options || []).map((o) => String(o).trim()).filter(Boolean);
    if (cleanOptions.length < 2) {
      return {
        success: false,
        status: 'failed',
        error: 'At least 2 1-Tap response options are required for sendPoll.',
      };
    }

    return this.postVaatiEndpoint('/api/sendPoll', payload.whatsappNumber, payload.session, (session, chatId) => ({
      session,
      chatId,
      poll: {
        name: payload.name,
        options: cleanOptions,
        multipleAnswers: Boolean(payload.multipleAnswers),
      },
    }));
  }

  /**
   * Formats footer lines in WhatsApp italic syntax (_line_) if not already wrapped.
   */
  public static formatItalicFooter(footer?: string): string {
    if (!footer || !footer.trim()) return '';
    return footer
      .trim()
      .split('\n')
      .map((line) => {
        const t = line.trim();
        if (!t) return '';
        if (t.startsWith('_') && t.endsWith('_') && t.length >= 2) return t;
        return `_${t}_`;
      })
      .filter(Boolean)
      .join('\n');
  }

  /**
   * Unified dispatcher across all 5 VAATI formats: text, url_text, image_text, pdf_text, poll
   */
  public static async dispatchMessage(payload: VaatiDispatchPayload): Promise<{
    success: boolean;
    providerMessageId?: string;
    status: string;
    error?: string;
  }> {
    const type: VaatiMessageType = payload.messageType || 'text';

    if (type === 'poll') {
      return this.sendPollMessage({
        whatsappNumber: payload.whatsappNumber,
        name: payload.text,
        options: payload.pollOptions || ['Yes, Confirm 👍', 'No, Cancel ❌'],
        multipleAnswers: payload.multipleAnswers,
        session: payload.session,
        broadcastTitle: payload.broadcastTitle,
      });
    }

    let bodyText = payload.text || '';
    if (payload.allowReplies && payload.replyPrompt && payload.replyPrompt.trim()) {
      const promptHint = this.formatItalicFooter(payload.replyPrompt.trim());
      if (promptHint && !bodyText.includes(payload.replyPrompt.trim()) && !bodyText.includes(promptHint)) {
        bodyText = bodyText ? `${bodyText}\n\n${promptHint}` : promptHint;
      }
    }
    const italicFooter = this.formatItalicFooter(payload.footer);
    if (italicFooter && !bodyText.includes(payload.footer!.trim()) && !bodyText.includes(italicFooter)) {
      bodyText = bodyText ? `${bodyText}\n\n${italicFooter}` : italicFooter;
    }

    if (type === 'image_text' || type === 'pdf_text') {
      const defaultMime = type === 'pdf_text' ? 'application/pdf' : 'image/jpeg';
      const defaultName = type === 'pdf_text' ? 'MAPIMS_Circular.pdf' : 'MAPIMS_Announcement.jpg';
      return this.sendFileMessage({
        whatsappNumber: payload.whatsappNumber,
        caption: bodyText,
        url: payload.mediaUrl,
        filename: payload.mediaFilename || defaultName,
        mimetype: payload.mediaMimetype || defaultMime,
        session: payload.session,
        broadcastTitle: payload.broadcastTitle,
      });
    }

    if (type === 'url_text') {
      let bodyWithUrl = bodyText;
      const url = (payload.ctaUrl || '').trim();
      if (url && !bodyWithUrl.includes(url)) {
        bodyWithUrl = bodyWithUrl ? `${bodyWithUrl}\n\n🔗 ${url}` : url;
      }
      return this.sendTextMessage({
        whatsappNumber: payload.whatsappNumber,
        text: bodyWithUrl,
        linkPreview: true,
        session: payload.session,
        broadcastTitle: payload.broadcastTitle,
      });
    }

    return this.sendTextMessage({
      whatsappNumber: payload.whatsappNumber,
      text: bodyText,
      session: payload.session,
      broadcastTitle: payload.broadcastTitle,
    });
  }

  /**
   * Batch dispatch for broadcast campaigns via VAATI (supports Text, URL+Text, Image+Text, PDF+Text, and 1-Tap Poll)
   * Incorporates polite pacing delay between dispatches to maintain WhatsApp Web session health
   */
  public static async sendBatchMessages(payload: {
    receivers: Array<{ whatsappNumber: string; text: string }>;
    broadcastTitle?: string;
    session?: string;
    pacingMs?: number;
    footer?: string;
    allowReplies?: boolean;
    replyPrompt?: string;
    messageType?: VaatiMessageType;
    ctaUrl?: string;
    mediaUrl?: string;
    mediaFilename?: string;
    mediaMimetype?: string;
    pollOptions?: string[];
    multipleAnswers?: boolean;
  }): Promise<{
    success: boolean;
    dispatchedCount: number;
    failedCount: number;
    dispatchedMessages: Array<{ whatsappNumber: string; waMessageId?: string; sentText: string }>;
    error?: string;
  }> {
    if (!this.isVaatiEnabled) {
      return {
        success: false,
        dispatchedCount: 0,
        failedCount: payload.receivers.length,
        dispatchedMessages: [],
        error: 'VAATI Gateway is currently turned OFF.',
      };
    }

    const pacing = payload.pacingMs ?? 250;
    let dispatchedCount = 0;
    let failedCount = 0;
    const dispatchedMessages: Array<{ whatsappNumber: string; waMessageId?: string; sentText: string }> = [];
    const msgType = payload.messageType || 'text';

    console.log(
      `[VAATI Service] Starting batch broadcast "${payload.broadcastTitle || 'Hospital Broadcast'}" (type: ${msgType}) to ${payload.receivers.length} recipients with ${pacing}ms pacing.`
    );

    for (const r of payload.receivers) {
      const res = await this.dispatchMessage({
        whatsappNumber: r.whatsappNumber,
        text: r.text,
        footer: payload.footer,
        allowReplies: payload.allowReplies,
        replyPrompt: payload.replyPrompt,
        messageType: msgType,
        ctaUrl: payload.ctaUrl,
        mediaUrl: payload.mediaUrl,
        mediaFilename: payload.mediaFilename,
        mediaMimetype: payload.mediaMimetype,
        pollOptions: payload.pollOptions,
        multipleAnswers: payload.multipleAnswers,
        session: payload.session,
        broadcastTitle: payload.broadcastTitle,
      });

      if (res.success) {
        dispatchedCount++;
        dispatchedMessages.push({
          whatsappNumber: r.whatsappNumber,
          waMessageId: res.providerMessageId,
          sentText: r.text,
        });
      } else {
        failedCount++;
      }

      if (pacing > 0 && payload.receivers.length > 1) {
        await new Promise((resolve) => setTimeout(resolve, pacing));
      }
    }

    return {
      success: dispatchedCount > 0,
      dispatchedCount,
      failedCount,
      dispatchedMessages,
    };
  }
}

