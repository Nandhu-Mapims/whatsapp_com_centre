"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WatiService = void 0;
const env_js_1 = require("../config/env.js");
const phoneUtils_js_1 = require("../utils/phoneUtils.js");
class WatiService {
    static endpoint = env_js_1.ENV.WATI_API_ENDPOINT;
    static token = env_js_1.ENV.WATI_ACCESS_TOKEN;
    /**
     * Fetch approved WhatsApp templates from live WATI API
     * STRICT FILTER: Only returns APH Connect templates (prefixed with 'aph_').
     * Completely excludes other hospital applications' templates (PACS, MHC, Incident, Lab, etc.)
     */
    static async fetchTemplates() {
        try {
            const url = `${this.endpoint}/api/v1/getMessageTemplates`;
            console.log(`[WATI Service] Synchronizing APH Connect templates from ${url}`);
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
                // Filter strictly for APH Connect templates (prefix 'aph_')
                // Exclude PACS, Incident, MHC, Lab, Discharge, etc.
                const aphOnly = json.messageTemplates.filter((t) => {
                    const name = String(t.elementName || '').toLowerCase();
                    const isOtherApp = name.includes('pacs') ||
                        name.includes('incident') ||
                        name.includes('healthcheck') ||
                        name.includes('mhc') ||
                        name.includes('discharge') ||
                        name.includes('lab') ||
                        name.includes('investigation') ||
                        name.includes('onboarding');
                    if (isOtherApp)
                        return false;
                    if (t.status === 'DELETED' || t.statusString === 'DELETED')
                        return false;
                    return name.startsWith('aph_') || name.startsWith('aphconnect_');
                });
                console.log(`[WATI Service] Found ${aphOnly.length} APH Connect templates (filtered out ${json.messageTemplates.length - aphOnly.length} templates from other hospital systems).`);
                return aphOnly.map((t) => ({
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
                    status: t.status || (t.statusString === 'APPROVED' ? 'APPROVED' : 'PENDING'),
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
     * Submit a new template to WATI & Meta for approval
     * Appears in WATI application under Templates for verification.
     * Does NOT disturb or touch any existing templates.
     */
    static async createTemplateInWati(payload) {
        try {
            const url = `${this.endpoint}/api/v1/whatsApp/templates`;
            console.log(`[WATI Service] Submitting template "${payload.elementName}" to WATI API (${url})`);
            const watiPayload = {
                type: 'template',
                elementName: payload.elementName,
                language: payload.language || 'en',
                category: payload.category || 'UTILITY',
                body: payload.body,
            };
            if (payload.header && payload.header.type !== 'NONE') {
                watiPayload.header = {
                    type: payload.header.type,
                    text: payload.header.text,
                    link: payload.header.link,
                };
            }
            if (payload.footer) {
                watiPayload.footer = payload.footer;
            }
            if (payload.buttons && payload.buttons.length > 0) {
                watiPayload.buttons = payload.buttons;
            }
            if (payload.customParams && payload.customParams.length > 0) {
                watiPayload.customParams = payload.customParams;
            }
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(watiPayload),
            });
            const resData = (await response.json());
            console.log(`[WATI Service] Template submission response:`, resData);
            if (resData.ok || resData.result) {
                return {
                    success: true,
                    data: resData.result || resData,
                };
            }
            else {
                const errorDetail = resData.error?.error_user_msg ||
                    resData.error?.message ||
                    resData.message ||
                    resData.info ||
                    'Failed to submit template to WATI';
                return {
                    success: false,
                    error: errorDetail,
                };
            }
        }
        catch (err) {
            console.error(`[WATI Service] Error creating template in WATI: ${err.message}`);
            return {
                success: false,
                error: err.message,
            };
        }
    }
    /**
     * Delete a template from WATI and Meta
     * Endpoint: DELETE /{tenantId}/api/v1/whatsApp/templates/{wabaId}/{templateName}
     */
    static async deleteTemplateInWati(params) {
        try {
            const cleanName = params.templateName.trim();
            const lang = params.language || 'en';
            const wabaId = params.wabaId || '1535495804649376';
            console.log(`[WATI Service] Deleting template "${cleanName}" (${lang}) from WATI...`);
            // 1. Try language-specific delete endpoint: DELETE /api/v1/whatsApp/templates/{wabaId}/{name}/{lang}
            const urlWithLang = `${this.endpoint}/api/v1/whatsApp/templates/${wabaId}/${cleanName}/${lang}`;
            let response = await fetch(urlWithLang, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                },
            });
            let resData = (await response.json().catch(() => ({})));
            console.log(`[WATI Service] Delete template response (with lang):`, resData);
            // 2. If not successful or not found, try without language: DELETE /api/v1/whatsApp/templates/{wabaId}/{name}
            if (!resData.ok && !resData.result?.toLowerCase?.().includes('success')) {
                const urlByName = `${this.endpoint}/api/v1/whatsApp/templates/${wabaId}/${cleanName}`;
                console.log(`[WATI Service] Retrying deletion across all languages via ${urlByName}`);
                const retryRes = await fetch(urlByName, {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${this.token}`,
                        'Content-Type': 'application/json',
                    },
                });
                const retryData = (await retryRes.json().catch(() => ({})));
                console.log(`[WATI Service] Delete template response (by name):`, retryData);
                if (retryData.ok || (typeof retryData.result === 'string' && retryData.result.toLowerCase().includes('success'))) {
                    return { success: true, message: `Template "${cleanName}" successfully deleted from WATI.` };
                }
                // If template was already deleted or not found in WATI, report success so local removal proceeds cleanly
                if ((typeof retryData.result === 'string' && retryData.result.includes('not found')) ||
                    (typeof resData.result === 'string' && resData.result.includes('not found'))) {
                    return { success: true, message: `Template "${cleanName}" removed locally (already absent or deleted in WATI).` };
                }
                return {
                    success: retryData.ok || false,
                    message: retryData.result || retryData.message || resData.result || 'Failed to delete template from WATI',
                };
            }
            return {
                success: true,
                message: `Template "${cleanName}" successfully deleted from WATI.`,
            };
        }
        catch (err) {
            console.error(`[WATI Service] Error deleting template from WATI: ${err.message}`);
            return {
                success: false,
                message: err.message,
            };
        }
    }
    /**
     * Strictly sanitize parameter values to satisfy WhatsApp Meta Cloud API constraints:
     * Meta rejects parameters containing \r, \n, \t or 4+ consecutive spaces.
     */
    static sanitizeParam(val) {
        if (val === null || val === undefined)
            return '';
        return String(val)
            .replace(/[\r\n\t]+/g, ' ')
            .replace(/\s{2,}/g, ' ')
            .trim();
    }
    /**
     * Dispatch a template message to an employee WhatsApp number
     */
    static async sendTemplateMessage(payload) {
        try {
            const cleanNumber = (0, phoneUtils_js_1.toWatiDigits)(payload.whatsappNumber);
            const url = `${this.endpoint}/api/v1/sendTemplateMessage?whatsappNumber=${cleanNumber}`;
            // Clean all parameter values for Meta compatibility
            const cleanParams = (payload.parameters || []).map((p) => ({
                ...p,
                value: this.sanitizeParam(p.value),
            }));
            console.log(`[WATI Service] Dispatching template "${payload.templateName}" to ${cleanNumber} with sanitized params:`, cleanParams);
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    template_name: payload.templateName,
                    broadcast_name: payload.broadcastTitle || 'APH Connect Broadcast',
                    parameters: cleanParams,
                }),
            });
            const resData = (await response.json());
            console.log('[WATI Service] Send response:', resData);
            const isSuccess = response.ok &&
                (resData.result === 'success' || resData.result === true) &&
                resData.validWhatsAppNumber !== false;
            if (isSuccess) {
                return {
                    success: true,
                    providerMessageId: resData.id || resData.phone_id || resData.local_message_id || `wati_${Date.now()}`,
                    status: 'submitted',
                };
            }
            else {
                let errorMessage = resData.info || resData.message;
                if (!errorMessage && resData.validWhatsAppNumber === false) {
                    errorMessage = `Recipient phone number (+${payload.whatsappNumber}) is not registered on WhatsApp.`;
                }
                return {
                    success: false,
                    status: 'failed',
                    error: errorMessage || JSON.stringify(resData),
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
     * Dispatch bulk broadcast template messages to multiple employees simultaneously via WATI
     */
    static async sendBatchTemplateMessages(payload) {
        try {
            const url = `${this.endpoint}/api/v1/sendTemplateMessages`;
            console.log(`[WATI Service] Launching bulk broadcast "${payload.broadcastTitle}" using template "${payload.templateName}" to ${payload.receivers.length} receivers.`);
            const formattedReceivers = payload.receivers.map((r) => ({
                whatsappNumber: (0, phoneUtils_js_1.toWatiDigits)(r.whatsappNumber),
                customParams: (r.customParams || []).map((cp) => ({
                    name: cp.name,
                    value: this.sanitizeParam(cp.value),
                })),
            }));
            // Chunk in batches of 500 for maximum reliability
            const BATCH_SIZE = 500;
            let totalDispatched = 0;
            for (let i = 0; i < formattedReceivers.length; i += BATCH_SIZE) {
                const batch = formattedReceivers.slice(i, i + BATCH_SIZE);
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${this.token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        template_name: payload.templateName,
                        broadcast_name: payload.broadcastTitle || 'APH Connect Hospital Broadcast',
                        Receivers: batch,
                    }),
                });
                const resData = (await response.json());
                console.log(`[WATI Service] Batch ${Math.floor(i / BATCH_SIZE) + 1} response:`, resData);
                if (response.ok && resData.result) {
                    totalDispatched += batch.length;
                }
                else {
                    console.warn(`[WATI Service] Batch error:`, resData);
                }
            }
            return {
                success: totalDispatched > 0,
                dispatchedCount: totalDispatched,
                error: totalDispatched === 0 ? 'WATI bulk dispatch rejected' : undefined,
            };
        }
        catch (err) {
            console.error(`[WATI Service] Bulk dispatch exception:`, err.message);
            return { success: false, dispatchedCount: 0, error: err.message };
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
    /**
     * Fetch live message delivery records directly from WATI API for a specific phone number
     */
    static async fetchLiveMessagesForNumber(whatsappNumber) {
        try {
            const cleanNum = (0, phoneUtils_js_1.toWatiDigits)(whatsappNumber);
            const url = `${this.endpoint}/api/v1/getMessages/${cleanNum}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                },
            });
            if (!response.ok)
                return [];
            const json = (await response.json());
            if (json && json.result === 'success' && json.messages && Array.isArray(json.messages.items)) {
                return json.messages.items;
            }
            return [];
        }
        catch (err) {
            console.warn(`[WATI Service] Could not fetch live messages for ${whatsappNumber}:`, err.message);
            return [];
        }
    }
    /**
     * Fetch live delivery reports across multiple tracked phone numbers
     */
    static async fetchLiveDeliveryReports(phoneNumbers) {
        const allRecords = [];
        for (const num of phoneNumbers) {
            const items = await this.fetchLiveMessagesForNumber(num);
            allRecords.push(...items.map((i) => ({ ...i, targetNumber: num })));
        }
        return allRecords;
    }
}
exports.WatiService = WatiService;
