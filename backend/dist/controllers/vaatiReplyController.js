"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVaatiReply = exports.updateVaatiReplyStatus = exports.syncVaatiRepliesNow = exports.getVaatiReplies = exports.handleVaatiWebhook = void 0;
const vaatiReplyService_js_1 = require("../services/vaatiReplyService.js");
/**
 * Webhook endpoint for WAHA (self-hosted VAATI WhatsApp Gateway)
 * Captures incoming replies (`message`, `message.any`, `poll.vote`) and stores them in MongoDB
 * ONLY when Replies are ON for the matching question template.
 */
const handleVaatiWebhook = async (req, res) => {
    try {
        const result = await vaatiReplyService_js_1.VaatiReplyService.processWebhookPayload(req.body);
        res.status(200).json({
            received: true,
            handled: result.handled,
            saved: result.saved,
            reason: result.reason,
            replyId: result.reply?.replyId,
        });
    }
    catch (err) {
        console.error('[VAATI Webhook] Processing error:', err.message);
        res.status(200).json({ received: true, saved: false, error: err.message });
    }
};
exports.handleVaatiWebhook = handleVaatiWebhook;
/**
 * List saved template replies from MongoDB (optionally triggers light sync first)
 */
const getVaatiReplies = async (req, res) => {
    try {
        const { templateId, campaignId, status, search, sync } = req.query;
        if (sync === 'true' || sync === '1') {
            await vaatiReplyService_js_1.VaatiReplyService.syncRepliesFromWaha();
        }
        const data = await vaatiReplyService_js_1.VaatiReplyService.listReplies({
            templateId: typeof templateId === 'string' ? templateId : undefined,
            campaignId: typeof campaignId === 'string' ? campaignId : undefined,
            status: typeof status === 'string' ? status : undefined,
            search: typeof search === 'string' ? search : undefined,
        });
        res.json({
            success: true,
            ...data,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.getVaatiReplies = getVaatiReplies;
/**
 * Trigger an immediate sync of recent WhatsApp messages from WAHA
 */
const syncVaatiRepliesNow = async (req, res) => {
    try {
        const { session } = req.body || {};
        const syncResult = await vaatiReplyService_js_1.VaatiReplyService.syncRepliesFromWaha(session);
        const data = await vaatiReplyService_js_1.VaatiReplyService.listReplies();
        res.json({
            success: true,
            syncedChats: syncResult.syncedChats,
            newReplies: syncResult.newReplies,
            syncError: syncResult.error,
            ...data,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.syncVaatiRepliesNow = syncVaatiRepliesNow;
/**
 * Update review status or admin note for a saved reply
 */
const updateVaatiReplyStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminNote } = req.body;
        const nextStatus = status === 'REVIEWED' ? 'REVIEWED' : 'NEW';
        const updated = await vaatiReplyService_js_1.VaatiReplyService.updateReplyStatus(String(id), nextStatus, adminNote !== undefined ? String(adminNote) : undefined);
        if (!updated) {
            return res.status(404).json({ success: false, message: 'Reply record not found.' });
        }
        res.json({
            success: true,
            message: `Reply marked as ${nextStatus}.`,
            data: updated,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.updateVaatiReplyStatus = updateVaatiReplyStatus;
/**
 * Delete a saved reply from DB
 */
const deleteVaatiReply = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await vaatiReplyService_js_1.VaatiReplyService.deleteReply(String(id));
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Reply record not found.' });
        }
        res.json({ success: true, message: 'Reply deleted successfully.' });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.deleteVaatiReply = deleteVaatiReply;
