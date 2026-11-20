"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WatiService = void 0;
const env_js_1 = require("../config/env.js");
class WatiService {
    static endpoint = env_js_1.ENV.WATI_API_ENDPOINT;
    static token = env_js_1.ENV.WATI_ACCESS_TOKEN;
    /**
     * Fetch approved WhatsApp templates from live WATI API
     */
    static async fetchTemplates() {
        try {
            const url = `${this.endpoint}/api/v1/getMessageTemplates`;
            console.log(`[WATI Service] Synchronizing templates from ${url}`);
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error(`WATI API returned HTTP ${response.status}: ${response.statusText}`);
            }
            const json = (await response.json());
            if (json.result === 'success' && Array.isArray(json.messageTemplates)) {
                return json.messageTemplates.map((t) => ({
                    id: t.id || `tmpl-${t.elementName}`,
                    watiTemplateId: t.elementName,
                    name: t.elementName,
                    category: t.category || 'UTILITY',
                    language: t.language?.value || 'en',
                    headerType: t.header?.headerTypeString?.toUpperCase() || (t.header?.text ? 'TEXT' : 'NONE'),
                    headerContent: t.header?.text || t.header?.link || undefined,
                    body: t.body || '',
                    footer: t.footer || '',
                    buttons: Array.isArray(t.buttons)
                        ? t.buttons.map((b) => ({
                            type: b.type === 'quick_reply' ? 'QUICK_REPLY' : (b.type?.toUpperCase() || 'QUICK_REPLY'),
                            text: b.parameter?.text || b.text || 'Button',
                            value: b.parameter?.url || b.parameter?.phoneNumber || undefined,
                        }))
                        : [],
                    variables: Array.isArray(t.customParams)
                        ? t.customParams.map((p) => ({
                            key: p.paramName,
                            sampleValue: p.paramValue,
                            description: `Variable {{${p.paramName}}}`,
                        }))
                        : [],
                    status: t.status || 'APPROVED',
                    lastSynced: new Date().toISOString(),
                    createdAt: t.lastModified?.split('T')[0] || new Date().toISOString().split('T')[0],
                }));
            }
            return [];
        }
        catch (err) {
            console.error(`[WATI Service] Error syncing templates: ${err.message}`);
            return [];
        }
    }
    /**
     * Dispatch a template message to an employee WhatsApp number
     */
    static async sendTemplateMessage(payload) {
        try {
            const cleanNumber = payload.whatsappNumber.replace(/[^0-9]/g, '');
            const url = `${this.endpoint}/api/v1/sendTemplateMessage?whatsappNumber=${cleanNumber}`;
            console.log(`[WATI Service] Dispatching template "${payload.templateName}" to ${cleanNumber}`);
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    template_name: payload.templateName,
                    broadcast_name: payload.broadcastTitle || 'APH Connect Broadcast',
                    parameters: payload.parameters,
                }),
            });
            const resData = (await response.json());
            console.log('[WATI Service] Send response:', resData);
            if (response.ok && (resData.result === 'success' || resData.validWhatsAppNumber)) {
                return {
                    success: true,
                    providerMessageId: resData.id || resData.phone_id || `wati_${Date.now()}`,
                    status: 'submitted',
                };
            }
            else {
                return {
                    success: false,
                    status: 'failed',
                    error: resData.info || resData.message || JSON.stringify(resData),
                };
            }
        }
        catch (err) {
            console.error(`[WATI Service] Error dispatching message: ${err.message}`);
            return {
                success: false,
                status: 'failed',
                error: err.message,
            };
        }
    }
    /**
     * Process incoming Webhook callback payload from WATI
     */
    static processWebhookEvent(body) {
        // Check if event is an inbound STOP keyword message
        if (body.text) {
            const text = String(body.text).trim().toUpperCase();
            if (text === 'STOP' || text === 'UNSUBSCRIBE' || text === 'CANCEL') {
                return {
                    eventType: 'opt_out',
                    data: {
                        whatsappNumber: body.waId || body.senderPhone,
                        keyword: text,
                        receivedAt: new Date(),
                    },
                };
            }
        }
        // Check delivery receipts
        if (body.statusString || body.eventType === 'message_status') {
            return {
                eventType: 'delivery_status',
                data: {
                    providerMessageId: body.id || body.messageId,
                    status: body.statusString || body.status,
                    timestamp: new Date(),
                },
            };
        }
        return { eventType: 'unknown', data: body };
    }
}
exports.WatiService = WatiService;
