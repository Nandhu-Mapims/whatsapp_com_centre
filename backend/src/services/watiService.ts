import { ENV } from '../config/env.js';

export interface WatiMessagePayload {
  whatsappNumber: string;
  templateName: string;
  broadcastTitle: string;
  parameters: Array<{ name: string; value: string }>;
}

export class WatiService {
  private static endpoint = ENV.WATI_API_ENDPOINT;
  private static token = ENV.WATI_ACCESS_TOKEN;

  /**
   * Fetch approved WhatsApp templates from live WATI API
   * STRICT FILTER: Only returns APH Connect templates (prefixed with 'aph_').
   * Completely excludes other hospital applications' templates (PACS, MHC, Incident, Lab, etc.)
   */
  public static async fetchTemplates(): Promise<any[]> {
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

      const json = (await response.json()) as any;
      if (json.result === 'success' && Array.isArray(json.messageTemplates)) {
        // Filter strictly for APH Connect templates (prefix 'aph_')
        // Exclude PACS, Incident, MHC, Lab, Discharge, etc.
        const aphOnly = json.messageTemplates.filter((t: any) => {
          const name = String(t.elementName || '').toLowerCase();
          const isOtherApp =
            name.includes('pacs') ||
            name.includes('incident') ||
            name.includes('healthcheck') ||
            name.includes('mhc') ||
            name.includes('discharge') ||
            name.includes('lab') ||
            name.includes('investigation') ||
            name.includes('onboarding');
          if (isOtherApp) return false;
          if (t.status === 'DELETED' || t.statusString === 'DELETED') return false;
          return name.startsWith('aph_') || name.startsWith('aphconnect_');
        });

        console.log(`[WATI Service] Found ${aphOnly.length} APH Connect templates (filtered out ${json.messageTemplates.length - aphOnly.length} templates from other hospital systems).`);

        return aphOnly.map((t: any) => ({
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
            ? t.buttons.map((b: any) => ({
                type: b.type === 'quick_reply' ? 'QUICK_REPLY' : (b.type?.toUpperCase() || 'QUICK_REPLY'),
                text: b.parameter?.text || b.text || 'Button',
                value: b.parameter?.url || b.parameter?.phoneNumber || undefined,
              }))
            : [],
          variables: Array.isArray(t.customParams)
            ? t.customParams.map((p: any) => ({
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
    } catch (err: any) {
      console.error(`[WATI Service] Error syncing templates: ${err.message}`);
      return [];
    }
  }

  /**
   * Submit a new template to WATI & Meta for approval
   * Appears in WATI application under Templates for verification.
   * Does NOT disturb or touch any existing templates.
   */
  public static async createTemplateInWati(payload: {
    elementName: string;
    category: string;
    language?: string;
    header?: { type: string; text?: string; link?: string };
    body: string;
    footer?: string;
    buttons?: any[];
    customParams?: Array<{ paramName: string; paramValue: string }>;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const url = `${this.endpoint}/api/v1/whatsApp/templates`;
      console.log(`[WATI Service] Submitting template "${payload.elementName}" to WATI API (${url})`);

      const watiPayload: any = {
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

      const resData = (await response.json()) as any;
      console.log(`[WATI Service] Template submission response:`, resData);

      if (resData.ok || resData.result) {
        return {
          success: true,
          data: resData.result || resData,
        };
      } else {
        return {
          success: false,
          error: resData.message || resData.error?.message || 'Failed to submit template to WATI',
        };
      }
    } catch (err: any) {
      console.error(`[WATI Service] Error creating template in WATI: ${err.message}`);
      return {
        success: false,
        error: err.message,
      };
    }
  }

  /**
   * Dispatch a template message to an employee WhatsApp number
   */
  public static async sendTemplateMessage(payload: WatiMessagePayload): Promise<{
    success: boolean;
    providerMessageId?: string;
    status: string;
    error?: string;
  }> {
    try {
      const cleanNumber = payload.whatsappNumber.replace(/[^0-9]/g, '');
      const url = `${this.endpoint}/api/v1/sendTemplateMessage?whatsappNumber=${cleanNumber}`;
      console.log(
        `[WATI Service] Dispatching template "${payload.templateName}" to ${cleanNumber}`
      );

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

      const resData = (await response.json()) as any;
      console.log('[WATI Service] Send response:', resData);

      if (response.ok && (resData.result === 'success' || resData.validWhatsAppNumber)) {
        return {
          success: true,
          providerMessageId: resData.id || resData.phone_id || `wati_${Date.now()}`,
          status: 'submitted',
        };
      } else {
        return {
          success: false,
          status: 'failed',
          error: resData.info || resData.message || JSON.stringify(resData),
        };
      }
    } catch (err: any) {
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
  public static processWebhookEvent(body: any): {
    eventType: 'delivery_status' | 'opt_out' | 'unknown';
    data: any;
  } {
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
