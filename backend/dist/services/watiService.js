"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WatiService = void 0;
const env_js_1 = require("../config/env.js");
class WatiService {
    static endpoint = env_js_1.ENV.WATI_API_ENDPOINT;
    static token = env_js_1.ENV.WATI_ACCESS_TOKEN;
    /**
     * Fetch approved WhatsApp templates from WATI API
     */
    static async fetchTemplates() {
        try {
            console.log(`[WATI Service] Synchronizing templates from ${this.endpoint}/getMessageTemplates`);
            // Simulating or forwarding to WATI endpoint
            return [];
        }
        catch (err) {
            console.error(`[WATI Service] Error syncing templates: ${err.message}`);
            throw err;
        }
    }
    /**
     * Dispatch a template message to an employee WhatsApp number
     */
    static async sendTemplateMessage(payload) {
        try {
            console.log(`[WATI Service] Dispatching template "${payload.templateName}" to ${payload.whatsappNumber}`);
            // In development / demo environment without live paid WATI credentials:
            // Return realistic provider response simulation with idempotency ID
            const providerId = `wati_msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            return {
                success: true,
                providerMessageId: providerId,
                status: 'submitted',
            };
        }
        catch (err) {
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
