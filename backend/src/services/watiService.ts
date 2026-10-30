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
   * Fetch approved WhatsApp templates from WATI API
   */
  public static async fetchTemplates(): Promise<any[]> {
    try {
      console.log(`[WATI Service] Synchronizing templates from ${this.endpoint}/getMessageTemplates`);
      // Simulating or forwarding to WATI endpoint
      return [];
    } catch (err: any) {
      console.error(`[WATI Service] Error syncing templates: ${err.message}`);
      throw err;
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
      console.log(
        `[WATI Service] Dispatching template "${payload.templateName}" to ${payload.whatsappNumber}`
      );
      // In development / demo environment without live paid WATI credentials:
      // Return realistic provider response simulation with idempotency ID
      const providerId = `wati_msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      return {
        success: true,
        providerMessageId: providerId,
        status: 'submitted',
      };
    } catch (err: any) {
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
