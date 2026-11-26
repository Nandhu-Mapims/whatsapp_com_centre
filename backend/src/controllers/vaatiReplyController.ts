import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { VaatiReplyService } from '../services/vaatiReplyService.js';

/**
 * Webhook endpoint for WAHA (self-hosted VAATI WhatsApp Gateway)
 * Captures incoming replies (`message`, `message.any`, `poll.vote`) and stores them in MongoDB
 * ONLY when Replies are ON for the matching question template.
 */
export const handleVaatiWebhook = async (req: Request, res: Response) => {
  try {
    const result = await VaatiReplyService.processWebhookPayload(req.body);
    res.status(200).json({
      received: true,
      handled: result.handled,
      saved: result.saved,
      reason: result.reason,
      replyId: result.reply?.replyId,
    });
  } catch (err: any) {
    console.error('[VAATI Webhook] Processing error:', err.message);
    res.status(200).json({ received: true, saved: false, error: err.message });
  }
};

/**
 * List saved template replies from MongoDB (optionally triggers light sync first)
 */
export const getVaatiReplies = async (req: AuthRequest, res: Response) => {
  try {
    const { templateId, campaignId, status, search, sync } = req.query;

    if (sync === 'true' || sync === '1') {
      await VaatiReplyService.syncRepliesFromWaha();
    }

    const data = await VaatiReplyService.listReplies({
      templateId: typeof templateId === 'string' ? templateId : undefined,
      campaignId: typeof campaignId === 'string' ? campaignId : undefined,
      status: typeof status === 'string' ? status : undefined,
      search: typeof search === 'string' ? search : undefined,
    });

    res.json({
      success: true,
      ...data,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Trigger an immediate sync of recent WhatsApp messages from WAHA
 */
export const syncVaatiRepliesNow = async (req: AuthRequest, res: Response) => {
  try {
    const { session } = req.body || {};
    const syncResult = await VaatiReplyService.syncRepliesFromWaha(session);
    const data = await VaatiReplyService.listReplies();

    res.json({
      success: true,
      syncedChats: syncResult.syncedChats,
      newReplies: syncResult.newReplies,
      syncError: syncResult.error,
      ...data,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Update review status or admin note for a saved reply
 */
export const updateVaatiReplyStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;
    const nextStatus = status === 'REVIEWED' ? 'REVIEWED' : 'NEW';

    const updated = await VaatiReplyService.updateReplyStatus(
      String(id),
      nextStatus,
      adminNote !== undefined ? String(adminNote) : undefined
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Reply record not found.' });
    }

    res.json({
      success: true,
      message: `Reply marked as ${nextStatus}.`,
      data: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Delete a saved reply from DB
 */
export const deleteVaatiReply = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await VaatiReplyService.deleteReply(String(id));
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Reply record not found.' });
    }
    res.json({ success: true, message: 'Reply deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

