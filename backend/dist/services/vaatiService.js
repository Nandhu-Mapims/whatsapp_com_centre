"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VaatiService = void 0;
const env_js_1 = require("../config/env.js");
const phoneUtils_js_1 = require("../utils/phoneUtils.js");
class VaatiService {
    static endpoint = env_js_1.ENV.VAATI_API_ENDPOINT || 'https://3001-agq5mu2udnuf7vw22ngl3q4tnq.instabox.tech';
    static apiKey = env_js_1.ENV.VAATI_API_KEY || '1e7312becddd4c639d10688ec7267aa9';
    static defaultSession = env_js_1.ENV.VAATI_SESSION || 'tenant_efs';
    static isVaatiEnabled = true;
    static isEnabled() {
        return this.isVaatiEnabled;
    }
    static setEnabled(enabled) {
        this.isVaatiEnabled = enabled;
        console.log(`[VAATI Service] Gateway state changed: isEnabled = ${enabled}`);
    }
    /**
     * Health and status check for VAATI instance on the VPS
     */
    static async getStatus() {
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
            const sessions = (await response.json());
            const workingSessions = sessions.filter((s) => s.status === 'WORKING');
            // Select active session: prefer configured defaultSession (tenant_efs), or first working session
            const primarySess = sessions.find((s) => s.name === this.defaultSession && s.status === 'WORKING') ||
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
        }
        catch (err) {
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
    static async postVaatiEndpoint(apiPath, whatsappNumber, requestedSession, buildBody) {
        if (!this.isVaatiEnabled) {
            return {
                success: false,
                status: 'disabled',
                error: 'VAATI Gateway is currently turned OFF. Please enable VAATI or switch to WATI.',
            };
        }
        try {
            const cleanDigits = (0, phoneUtils_js_1.toWatiDigits)(whatsappNumber);
            const chatId = `${cleanDigits}@c.us`;
            let session = requestedSession || '';
            if (!session) {
                const st = await this.getStatus();
                session = st.session || this.defaultSession;
            }
            const url = `${this.endpoint}${apiPath}`;
            const bodyPayload = buildBody(session, chatId);
            console.log(`[VAATI Service] Dispatching ${apiPath} to ${chatId} via session "${session}" (${url}):`, JSON.stringify(bodyPayload).slice(0, 140));
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': this.apiKey,
                },
                body: JSON.stringify(bodyPayload),
            });
            const resData = (await response.json());
            if (response.ok && (resData.id || resData._data?.id)) {
                const msgId = resData.id?._serialized ||
                    resData.id?.id ||
                    resData._data?.id?._serialized ||
                    resData._data?.id?.id ||
                    `vaati_${Date.now()}`;
                return {
                    success: true,
                    providerMessageId: msgId,
                    status: 'submitted',
                };
            }
            else {
                const errMsg = resData.message || resData.error || `HTTP ${response.status}: Failed to send via VAATI`;
                return {
                    success: false,
                    status: 'failed',
                    error: errMsg,
                };
            }
        }
        catch (err) {
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
    static async sendTextMessage(payload) {
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
    static async sendFileMessage(payload) {
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
        const fileObj = { mimetype, filename };
        if (rawData) {
            fileObj.data = rawData;
        }
        else {
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
    static async sendPollMessage(payload) {
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
    static formatItalicFooter(footer) {
        if (!footer || !footer.trim())
            return '';
        return footer
            .trim()
            .split('\n')
            .map((line) => {
            const t = line.trim();
            if (!t)
                return '';
            if (t.startsWith('_') && t.endsWith('_') && t.length >= 2)
                return t;
            return `_${t}_`;
        })
            .filter(Boolean)
            .join('\n');
    }
    /**
     * Unified dispatcher across all 5 VAATI formats: text, url_text, image_text, pdf_text, poll
     */
    static async dispatchMessage(payload) {
        const type = payload.messageType || 'text';
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
        if (italicFooter && !bodyText.includes(payload.footer.trim()) && !bodyText.includes(italicFooter)) {
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
    static async sendBatchMessages(payload) {
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
        const dispatchedMessages = [];
        const msgType = payload.messageType || 'text';
        console.log(`[VAATI Service] Starting batch broadcast "${payload.broadcastTitle || 'Hospital Broadcast'}" (type: ${msgType}) to ${payload.receivers.length} recipients with ${pacing}ms pacing.`);
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
            }
            else {
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
exports.VaatiService = VaatiService;
