"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VaatiReplyService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const mongoose_1 = __importDefault(require("mongoose"));
const env_js_1 = require("../config/env.js");
const VaatiReply_js_1 = require("../models/VaatiReply.js");
const phoneUtils_js_1 = require("../utils/phoneUtils.js");
const isMongoReady = () => mongoose_1.default.connection.readyState === 1;
const resolveDataPaths = (filename) => [
    path_1.default.resolve(process.cwd(), `backend/src/data/${filename}`),
    path_1.default.resolve(process.cwd(), `backend/dist/data/${filename}`),
    path_1.default.resolve(process.cwd(), `src/data/${filename}`),
    path_1.default.resolve(__dirname, `../data/${filename}`),
    path_1.default.resolve(__dirname, `../../src/data/${filename}`),
];
function loadJsonArray(filename) {
    for (const p of resolveDataPaths(filename)) {
        try {
            if (fs_1.default.existsSync(p)) {
                const parsed = JSON.parse(fs_1.default.readFileSync(p, 'utf8'));
                if (Array.isArray(parsed))
                    return parsed;
            }
        }
        catch { }
    }
    return [];
}
function persistJsonArray(filename, items) {
    let wroteAtLeastOne = false;
    for (const p of resolveDataPaths(filename)) {
        try {
            const dir = path_1.default.dirname(p);
            if (fs_1.default.existsSync(dir)) {
                fs_1.default.writeFileSync(p, JSON.stringify(items, null, 2));
                wroteAtLeastOne = true;
            }
        }
        catch { }
    }
    if (!wroteAtLeastOne) {
        const primary = resolveDataPaths(filename)[0];
        try {
            fs_1.default.mkdirSync(path_1.default.dirname(primary), { recursive: true });
            fs_1.default.writeFileSync(primary, JSON.stringify(items, null, 2));
        }
        catch { }
    }
}
class VaatiReplyService {
    static endpoint = env_js_1.ENV.VAATI_API_ENDPOINT || 'https://3001-agq5mu2udnuf7vw22ngl3q4tnq.instabox.tech';
    static apiKey = env_js_1.ENV.VAATI_API_KEY || '1e7312becddd4c639d10688ec7267aa9';
    static defaultSession = env_js_1.ENV.VAATI_SESSION || 'tenant_efs';
    static outboundMemory = [];
    static repliesMemory = [];
    static employeesCache = [];
    static lidToPhoneCache = new Map();
    static templateReplySettings = new Map();
    static syncTimer = null;
    static isSyncing = false;
    static initialized = false;
    static extractStanzaId(waMessageId) {
        if (!waMessageId)
            return '';
        // Format examples:
        // true_54997156950167@lid_3EB0E9A0871A680B2EFF8B_out
        // false_107387251851359@lid_3EB051AC175F700580974B
        const parts = String(waMessageId).split('_');
        if (parts.length >= 3) {
            return parts[2];
        }
        return String(waMessageId);
    }
    static async init() {
        if (this.initialized)
            return;
        this.initialized = true;
        this.outboundMemory = loadJsonArray('vaati_outbound.json');
        this.repliesMemory = loadJsonArray('vaati_replies.json');
        this.employeesCache = loadJsonArray('employees.json');
        // Hydrate template allowReplies map from vaati_templates.json
        const templates = loadJsonArray('vaati_templates.json');
        templates.forEach((t) => {
            if (t.id)
                this.templateReplySettings.set(t.id, Boolean(t.allowReplies));
            if (t.name)
                this.templateReplySettings.set(t.name, Boolean(t.allowReplies));
        });
        if (isMongoReady()) {
            try {
                const dbOutbound = await VaatiReply_js_1.VaatiOutboundMessageModel.find({})
                    .sort({ sentAt: -1 })
                    .limit(1000)
                    .lean();
                if (dbOutbound.length > 0) {
                    const seen = new Set(dbOutbound.map((d) => d.waMessageId));
                    const merged = [
                        ...dbOutbound.map((d) => ({
                            waMessageId: d.waMessageId,
                            waStanzaId: d.waStanzaId || this.extractStanzaId(d.waMessageId),
                            session: d.session,
                            chatId: d.chatId,
                            recipientPhone: d.recipientPhone,
                            recipientName: d.recipientName,
                            templateId: d.templateId,
                            templateName: d.templateName,
                            templateTitle: d.templateTitle,
                            campaignId: d.campaignId,
                            campaignTitle: d.campaignTitle,
                            messageType: d.messageType,
                            sentText: d.sentText,
                            allowReplies: Boolean(d.allowReplies),
                            replyPrompt: d.replyPrompt,
                            sentBy: d.sentBy,
                            sentAt: new Date(d.sentAt).toISOString(),
                        })),
                        ...this.outboundMemory.filter((m) => !seen.has(m.waMessageId)),
                    ];
                    this.outboundMemory = merged.slice(0, 1000);
                }
                const dbReplies = await VaatiReply_js_1.VaatiReplyModel.find({})
                    .sort({ repliedAt: -1 })
                    .limit(1000)
                    .lean();
                if (dbReplies.length > 0) {
                    const seenR = new Set(dbReplies.map((r) => r.waMessageId));
                    const mergedR = [
                        ...dbReplies.map((r) => ({
                            replyId: r.replyId,
                            waMessageId: r.waMessageId,
                            session: r.session,
                            senderPhone: r.senderPhone,
                            senderChatId: r.senderChatId,
                            senderName: r.senderName,
                            employeeId: r.employeeId,
                            department: r.department,
                            designation: r.designation,
                            templateId: r.templateId,
                            templateName: r.templateName,
                            templateTitle: r.templateTitle,
                            campaignId: r.campaignId,
                            campaignTitle: r.campaignTitle,
                            questionText: r.questionText,
                            outboundWaMessageId: r.outboundWaMessageId,
                            replyType: r.replyType,
                            replyText: r.replyText,
                            selectedOptions: r.selectedOptions || [],
                            hasMedia: Boolean(r.hasMedia),
                            mediaType: r.mediaType,
                            quotedMatch: Boolean(r.quotedMatch),
                            repliedAt: new Date(r.repliedAt).toISOString(),
                            status: (r.status || 'NEW'),
                            adminNote: r.adminNote,
                        })),
                        ...this.repliesMemory.filter((m) => !seenR.has(m.waMessageId)),
                    ];
                    this.repliesMemory = mergedR.slice(0, 1000);
                }
                else if (this.repliesMemory.length > 0) {
                    // Backfill local JSON replies into MongoDB if empty
                    for (const rep of this.repliesMemory) {
                        await VaatiReply_js_1.VaatiReplyModel.updateOne({ waMessageId: rep.waMessageId }, { $setOnInsert: { ...rep, repliedAt: new Date(rep.repliedAt) } }, { upsert: true }).catch(() => { });
                    }
                }
            }
            catch (err) {
                console.warn('[VAATI Replies] MongoDB hydration warning:', err.message);
            }
        }
        console.log(`[VAATI Replies] Initialized (${this.outboundMemory.length} tracked outbound, ${this.repliesMemory.length} saved replies).`);
    }
    static initAutoSync() {
        this.init().catch(() => { });
        if (this.syncTimer)
            return;
        // Initial sync after 3s, then every 10s
        setTimeout(() => {
            this.syncRepliesFromWaha().catch(() => { });
        }, 3000);
        this.syncTimer = setInterval(() => {
            this.syncRepliesFromWaha().catch(() => { });
        }, 10000);
        console.log('[VAATI Replies] Background WhatsApp reply sync active (every 10s).');
    }
    static setTemplateReplySetting(templateId, templateName, allowReplies) {
        if (templateId)
            this.templateReplySettings.set(templateId, allowReplies);
        if (templateName)
            this.templateReplySettings.set(templateName, allowReplies);
    }
    static isTemplateReplyAllowed(templateId, templateName, outboundSnapshot) {
        if (templateId && this.templateReplySettings.has(templateId)) {
            return Boolean(this.templateReplySettings.get(templateId));
        }
        if (templateName && this.templateReplySettings.has(templateName)) {
            return Boolean(this.templateReplySettings.get(templateName));
        }
        return Boolean(outboundSnapshot);
    }
    static matchEmployeeByPhone(phoneDigits) {
        const clean = phoneDigits.replace(/[^0-9]/g, '');
        if (clean.length < 10)
            return undefined;
        const last10 = clean.slice(-10);
        return this.employeesCache.find((e) => {
            const empClean = (e.whatsappNumber || '').replace(/[^0-9]/g, '');
            return empClean.length >= 10 && empClean.slice(-10) === last10;
        });
    }
    static async recordOutboundDispatch(params) {
        await this.init();
        if (!params.waMessageId)
            return;
        const cleanDigits = (0, phoneUtils_js_1.toWatiDigits)(params.whatsappNumber);
        const norm = (0, phoneUtils_js_1.normalizePhoneNumber)(cleanDigits);
        const recipientPhone = norm.isValid ? norm.e164 : `+${cleanDigits}`;
        const chatId = `${cleanDigits}@c.us`;
        const emp = this.matchEmployeeByPhone(cleanDigits);
        const record = {
            waMessageId: params.waMessageId,
            waStanzaId: this.extractStanzaId(params.waMessageId),
            session: params.session || this.defaultSession,
            chatId,
            recipientPhone,
            recipientName: emp?.name,
            templateId: params.templateId || params.templateName || 'custom_question',
            templateName: params.templateName || 'custom_question',
            templateTitle: params.templateTitle || params.templateName || 'VAATI Question Message',
            campaignId: params.campaignId,
            campaignTitle: params.campaignTitle,
            messageType: params.messageType || 'text',
            sentText: params.sentText,
            allowReplies: Boolean(params.allowReplies),
            replyPrompt: params.replyPrompt,
            sentBy: params.sentBy || 'Authorized Staff',
            sentAt: new Date().toISOString(),
        };
        const existingIdx = this.outboundMemory.findIndex((o) => o.waMessageId === record.waMessageId);
        if (existingIdx === -1) {
            this.outboundMemory.unshift(record);
            if (this.outboundMemory.length > 1000)
                this.outboundMemory.length = 1000;
            persistJsonArray('vaati_outbound.json', this.outboundMemory);
        }
        if (isMongoReady()) {
            try {
                await VaatiReply_js_1.VaatiOutboundMessageModel.updateOne({ waMessageId: record.waMessageId }, {
                    $setOnInsert: {
                        ...record,
                        sentAt: new Date(record.sentAt),
                    },
                }, { upsert: true });
            }
            catch (err) {
                console.warn('[VAATI Replies] Failed saving outbound tracking to Mongo:', err.message);
            }
        }
    }
    static async resolvePhoneDigits(session, rawId) {
        if (!rawId)
            return { digits: '', e164: '' };
        const cleanRaw = String(rawId).trim();
        if (cleanRaw.endsWith('@c.us')) {
            const digits = (0, phoneUtils_js_1.toWatiDigits)(cleanRaw.replace('@c.us', ''));
            const norm = (0, phoneUtils_js_1.normalizePhoneNumber)(digits);
            return { digits, e164: norm.isValid ? norm.e164 : `+${digits}` };
        }
        if (cleanRaw.endsWith('@lid')) {
            if (this.lidToPhoneCache.has(cleanRaw)) {
                const cached = this.lidToPhoneCache.get(cleanRaw);
                const norm = (0, phoneUtils_js_1.normalizePhoneNumber)(cached);
                return { digits: cached, e164: norm.isValid ? norm.e164 : `+${cached}`, lid: cleanRaw };
            }
            try {
                const res = await fetch(`${this.endpoint}/api/${encodeURIComponent(session)}/lids/${encodeURIComponent(cleanRaw)}`, {
                    headers: {
                        'X-Api-Key': this.apiKey,
                        'Content-Type': 'application/json',
                    },
                });
                if (res.ok) {
                    const json = (await res.json());
                    if (json.pn) {
                        const digits = (0, phoneUtils_js_1.toWatiDigits)(json.pn.replace('@c.us', ''));
                        this.lidToPhoneCache.set(cleanRaw, digits);
                        const norm = (0, phoneUtils_js_1.normalizePhoneNumber)(digits);
                        return { digits, e164: norm.isValid ? norm.e164 : `+${digits}`, lid: cleanRaw };
                    }
                }
            }
            catch { }
        }
        const fallbackDigits = (0, phoneUtils_js_1.toWatiDigits)(cleanRaw.replace(/@.*/, ''));
        const norm = (0, phoneUtils_js_1.normalizePhoneNumber)(fallbackDigits);
        return { digits: fallbackDigits, e164: norm.isValid ? norm.e164 : `+${fallbackDigits}` };
    }
    static findMatchingOutbound(params) {
        const { quotedId, senderDigits, senderChatId, msgTsSeconds } = params;
        // Priority 1: Direct quoted reply matching tracked waMessageId or waStanzaId
        if (quotedId) {
            const qStanza = this.extractStanzaId(quotedId);
            const qMatch = this.outboundMemory.find((o) => o.waMessageId === quotedId ||
                (qStanza && (o.waStanzaId === qStanza || o.waMessageId.includes(qStanza))));
            if (qMatch) {
                return { outbound: qMatch, quotedMatch: true };
            }
        }
        // Priority 2: Direct message reply in the same 1:1 chat after an active outbound message
        const last10 = senderDigits.length >= 10 ? senderDigits.slice(-10) : '';
        const minWindowMs = (msgTsSeconds - 48 * 3600) * 1000;
        const candidates = this.outboundMemory.filter((o) => {
            const sentMs = new Date(o.sentAt).getTime();
            if (sentMs > msgTsSeconds * 1000 + 15000)
                return false; // Sent after reply
            if (sentMs < minWindowMs)
                return false;
            const outLast10 = o.recipientPhone.replace(/[^0-9]/g, '').slice(-10);
            return ((last10 && outLast10 === last10) ||
                o.chatId === senderChatId);
        });
        if (candidates.length > 0) {
            // Sorted newest first
            candidates.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
            return { outbound: candidates[0], quotedMatch: false };
        }
        return { outbound: undefined, quotedMatch: false };
    }
    static async saveReplyRecord(record) {
        if (this.repliesMemory.some((r) => r.waMessageId === record.waMessageId)) {
            return { saved: false, duplicate: true };
        }
        this.repliesMemory.unshift(record);
        if (this.repliesMemory.length > 1000)
            this.repliesMemory.length = 1000;
        persistJsonArray('vaati_replies.json', this.repliesMemory);
        if (isMongoReady()) {
            try {
                await VaatiReply_js_1.VaatiReplyModel.updateOne({ waMessageId: record.waMessageId }, {
                    $setOnInsert: {
                        ...record,
                        repliedAt: new Date(record.repliedAt),
                    },
                }, { upsert: true });
            }
            catch (err) {
                console.warn('[VAATI Replies] MongoDB save warning:', err.message);
            }
        }
        console.log(`[VAATI Replies] Saved reply from ${record.senderName} (${record.senderPhone}) for template "${record.templateTitle}" -> "${record.replyText.slice(0, 60)}"`);
        return { saved: true };
    }
    static async processIncomingWahaMessage(msg, session = this.defaultSession, selfPhoneDigits) {
        await this.init();
        if (!msg || !msg.id)
            return { saved: false, reason: 'missing_message_id' };
        const waMessageId = String(msg.id);
        if (this.repliesMemory.some((r) => r.waMessageId === waMessageId)) {
            return { saved: false, reason: 'already_saved' };
        }
        // Never ingest our own outbound dispatches
        const stanzaId = this.extractStanzaId(waMessageId);
        const isTrackedOutbound = this.outboundMemory.some((o) => o.waMessageId === waMessageId || (stanzaId && o.waStanzaId === stanzaId));
        if (isTrackedOutbound) {
            return { saved: false, reason: 'is_tracked_outbound' };
        }
        const rawChatId = String(msg.from || msg.chatId || '');
        if (rawChatId.endsWith('@g.us')) {
            // Do not scrape group chats unless a dispatch specifically targeted that group
            const targetedGroup = this.outboundMemory.some((o) => o.chatId === rawChatId);
            if (!targetedGroup) {
                return { saved: false, reason: 'group_chat_ignored' };
            }
        }
        const rawType = String(msg._data?.type || msg.type || 'chat');
        if (['e2e_notification', 'notification_template', 'revoked', 'poll_creation'].includes(rawType)) {
            return { saved: false, reason: `ignored_type_${rawType}` };
        }
        const quotedId = msg.replyTo?.id ||
            (typeof msg.replyTo === 'string' ? msg.replyTo : undefined) ||
            msg._data?.quotedStanzaID ||
            msg._data?.quotedMsg?.id?._serialized ||
            msg._data?.quotedMsg?.id;
        const senderRaw = msg.fromMe ? (msg.to || rawChatId) : (msg.participant || msg.author || rawChatId);
        const { digits, e164 } = await this.resolvePhoneDigits(session, senderRaw);
        const msgTs = Number(msg.timestamp || Math.floor(Date.now() / 1000));
        // Self-chat check: when testing from tenant_efs to itself, only treat as user reply if
        // either it explicitly quotes one of our questions OR it was typed after our latest reply-enabled question (not an older API msg)
        if (msg.fromMe) {
            const isSelfChat = selfPhoneDigits && digits && digits.slice(-10) === selfPhoneDigits.slice(-10);
            if (!isSelfChat && !quotedId) {
                return { saved: false, reason: 'outbound_from_me_ignored' };
            }
        }
        const { outbound, quotedMatch } = this.findMatchingOutbound({
            quotedId: quotedId ? String(quotedId) : undefined,
            senderDigits: digits,
            senderChatId: rawChatId,
            msgTsSeconds: msgTs,
        });
        if (!outbound) {
            return { saved: false, reason: 'no_matching_template_question' };
        }
        // Strict ON/OFF check: Only save if Reply is ON for the question template / dispatch
        const replyEnabled = outbound.allowReplies &&
            this.isTemplateReplyAllowed(outbound.templateId, outbound.templateName, outbound.allowReplies);
        if (!replyEnabled) {
            return { saved: false, reason: 'replies_turned_off_for_template' };
        }
        // In self-chat test mode without quote, skip older API-generated 3EB0 messages from unrelated tests
        if (msg.fromMe && !quotedMatch && waMessageId.includes('_3EB0')) {
            return { saved: false, reason: 'self_api_message_skipped' };
        }
        const bodyText = String(msg.body || msg._data?.caption || '').trim();
        const hasMedia = Boolean(msg.hasMedia);
        const replyText = bodyText || (hasMedia ? `[Sent ${rawType} attachment]` : '');
        if (!replyText) {
            return { saved: false, reason: 'empty_reply_body' };
        }
        const emp = this.matchEmployeeByPhone(digits);
        const senderName = emp?.name ||
            msg._data?.notifyName ||
            msg.notifyName ||
            msg.pushName ||
            e164 ||
            rawChatId;
        const replyRecord = {
            replyId: `vrep-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            waMessageId,
            session,
            senderPhone: e164 || rawChatId,
            senderChatId: rawChatId,
            senderName,
            employeeId: emp?.employeeId,
            department: emp?.department,
            designation: emp?.designation,
            templateId: outbound.templateId,
            templateName: outbound.templateName,
            templateTitle: outbound.templateTitle,
            campaignId: outbound.campaignId,
            campaignTitle: outbound.campaignTitle,
            questionText: outbound.sentText,
            outboundWaMessageId: outbound.waMessageId,
            replyType: hasMedia ? 'media' : 'text',
            replyText,
            selectedOptions: [],
            hasMedia,
            mediaType: hasMedia ? rawType : undefined,
            quotedMatch,
            repliedAt: new Date(msgTs * 1000).toISOString(),
            status: 'NEW',
        };
        const res = await this.saveReplyRecord(replyRecord);
        return {
            saved: res.saved,
            reason: res.saved ? 'saved_to_db' : 'duplicate',
            reply: res.saved ? replyRecord : undefined,
        };
    }
    static async processWebhookPayload(body) {
        await this.init();
        const event = String(body?.event || '');
        const session = String(body?.session || this.defaultSession);
        const payload = body?.payload || body;
        if (event === 'poll.vote' && payload) {
            const parentId = payload.pollKey?.id ||
                payload.pollMessageId ||
                payload.parentMessageId ||
                payload._data?.parentMsgKey?.id ||
                '';
            const voterRaw = String(payload.voter || payload.from || '');
            const { digits, e164 } = await this.resolvePhoneDigits(session, voterRaw);
            const selectedOptions = Array.isArray(payload.selectedOptions)
                ? payload.selectedOptions.map((o) => String(o?.name || o).trim()).filter(Boolean)
                : [];
            const { outbound, quotedMatch } = this.findMatchingOutbound({
                quotedId: parentId ? String(parentId) : undefined,
                senderDigits: digits,
                senderChatId: voterRaw,
                msgTsSeconds: Number(payload.timestamp || Math.floor(Date.now() / 1000)),
            });
            if (!outbound) {
                return { handled: true, saved: false, reason: 'no_matching_poll_question' };
            }
            const replyEnabled = outbound.allowReplies &&
                this.isTemplateReplyAllowed(outbound.templateId, outbound.templateName, outbound.allowReplies);
            if (!replyEnabled) {
                return { handled: true, saved: false, reason: 'replies_turned_off_for_template' };
            }
            const answerText = selectedOptions.length > 0 ? selectedOptions.join(', ') : '[Cleared Poll Vote]';
            const voteKey = `pollvote_${outbound.waStanzaId || outbound.waMessageId}_${digits || voterRaw}_${Number(payload.timestamp || Date.now())}`;
            const emp = this.matchEmployeeByPhone(digits);
            const replyRecord = {
                replyId: `vrep-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                waMessageId: voteKey,
                session,
                senderPhone: e164 || voterRaw,
                senderChatId: voterRaw,
                senderName: emp?.name || e164 || voterRaw,
                employeeId: emp?.employeeId,
                department: emp?.department,
                designation: emp?.designation,
                templateId: outbound.templateId,
                templateName: outbound.templateName,
                templateTitle: outbound.templateTitle,
                campaignId: outbound.campaignId,
                campaignTitle: outbound.campaignTitle,
                questionText: outbound.sentText,
                outboundWaMessageId: outbound.waMessageId,
                replyType: 'poll_vote',
                replyText: answerText,
                selectedOptions,
                hasMedia: false,
                quotedMatch,
                repliedAt: new Date(Number(payload.timestamp ? payload.timestamp * 1000 : Date.now())).toISOString(),
                status: 'NEW',
            };
            const saved = await this.saveReplyRecord(replyRecord);
            return {
                handled: true,
                saved: saved.saved,
                reason: saved.saved ? 'poll_vote_saved' : 'duplicate',
                reply: saved.saved ? replyRecord : undefined,
            };
        }
        if (event === 'message' || event === 'message.any' || payload?.body !== undefined || payload?.id) {
            const meDigits = body?.me?.id ? (0, phoneUtils_js_1.toWatiDigits)(String(body.me.id).replace(/@.*/, '')) : undefined;
            const result = await this.processIncomingWahaMessage(payload, session, meDigits);
            return { handled: true, ...result };
        }
        return { handled: false, saved: false, reason: `unhandled_event_${event || 'unknown'}` };
    }
    static async syncRepliesFromWaha(requestedSession) {
        await this.init();
        if (this.isSyncing)
            return { syncedChats: 0, newReplies: 0 };
        this.isSyncing = true;
        let syncedChats = 0;
        let newReplies = 0;
        try {
            const session = requestedSession || this.defaultSession;
            // Check session info & self number
            const sessRes = await fetch(`${this.endpoint}/api/sessions/${encodeURIComponent(session)}`, {
                headers: { 'X-Api-Key': this.apiKey, 'Content-Type': 'application/json' },
            });
            if (!sessRes.ok) {
                return { syncedChats: 0, newReplies: 0, error: `WAHA HTTP ${sessRes.status}` };
            }
            const sessJson = (await sessRes.json());
            if (sessJson.status !== 'WORKING') {
                return { syncedChats: 0, newReplies: 0 };
            }
            const selfDigits = sessJson.me?.id
                ? (0, phoneUtils_js_1.toWatiDigits)(String(sessJson.me.id).replace(/@.*/, ''))
                : undefined;
            if (sessJson.me?.lid && selfDigits) {
                this.lidToPhoneCache.set(String(sessJson.me.lid), selfDigits);
            }
            // Build target chatIds from active reply-enabled outbound dispatches + top 1:1 chats
            const targetChatIds = new Set();
            this.outboundMemory
                .filter((o) => this.isTemplateReplyAllowed(o.templateId, o.templateName, o.allowReplies))
                .slice(0, 20)
                .forEach((o) => targetChatIds.add(o.chatId));
            const chatsRes = await fetch(`${this.endpoint}/api/${encodeURIComponent(session)}/chats?limit=15`, {
                headers: { 'X-Api-Key': this.apiKey, 'Content-Type': 'application/json' },
            });
            if (chatsRes.ok) {
                const chats = (await chatsRes.json());
                if (Array.isArray(chats)) {
                    chats
                        .filter((c) => !c.isGroup && c.id?._serialized)
                        .slice(0, 10)
                        .forEach((c) => targetChatIds.add(c.id._serialized));
                }
            }
            for (const chatId of targetChatIds) {
                try {
                    const msgRes = await fetch(`${this.endpoint}/api/${encodeURIComponent(session)}/chats/${encodeURIComponent(chatId)}/messages?limit=12`, {
                        headers: { 'X-Api-Key': this.apiKey, 'Content-Type': 'application/json' },
                    });
                    if (!msgRes.ok)
                        continue;
                    syncedChats++;
                    const messages = (await msgRes.json());
                    if (!Array.isArray(messages))
                        continue;
                    // Process oldest -> newest
                    const ordered = [...messages].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
                    for (const m of ordered) {
                        const res = await this.processIncomingWahaMessage(m, session, selfDigits);
                        if (res.saved)
                            newReplies++;
                    }
                }
                catch { }
            }
            return { syncedChats, newReplies };
        }
        catch (err) {
            return { syncedChats, newReplies, error: err.message };
        }
        finally {
            this.isSyncing = false;
        }
    }
    static async listReplies(filters) {
        await this.init();
        let allReplies = [...this.repliesMemory];
        if (isMongoReady()) {
            try {
                const docs = await VaatiReply_js_1.VaatiReplyModel.find({}).sort({ repliedAt: -1 }).limit(1000).lean();
                if (docs.length > 0 || this.repliesMemory.length === 0) {
                    allReplies = docs.map((r) => ({
                        replyId: r.replyId,
                        waMessageId: r.waMessageId,
                        session: r.session,
                        senderPhone: r.senderPhone,
                        senderChatId: r.senderChatId,
                        senderName: r.senderName,
                        employeeId: r.employeeId,
                        department: r.department,
                        designation: r.designation,
                        templateId: r.templateId,
                        templateName: r.templateName,
                        templateTitle: r.templateTitle,
                        campaignId: r.campaignId,
                        campaignTitle: r.campaignTitle,
                        questionText: r.questionText,
                        outboundWaMessageId: r.outboundWaMessageId,
                        replyType: r.replyType,
                        replyText: r.replyText,
                        selectedOptions: r.selectedOptions || [],
                        hasMedia: Boolean(r.hasMedia),
                        mediaType: r.mediaType,
                        quotedMatch: Boolean(r.quotedMatch),
                        repliedAt: new Date(r.repliedAt).toISOString(),
                        status: (r.status || 'NEW'),
                        adminNote: r.adminNote,
                    }));
                }
            }
            catch { }
        }
        const countsByTemplate = {};
        let newRepliesCount = 0;
        allReplies.forEach((r) => {
            countsByTemplate[r.templateId] = (countsByTemplate[r.templateId] || 0) + 1;
            if (r.templateName && r.templateName !== r.templateId) {
                countsByTemplate[r.templateName] = (countsByTemplate[r.templateName] || 0) + 1;
            }
            if (r.status === 'NEW')
                newRepliesCount++;
        });
        let filtered = allReplies;
        if (filters?.templateId && filters.templateId !== 'ALL') {
            filtered = filtered.filter((r) => r.templateId === filters.templateId || r.templateName === filters.templateId);
        }
        if (filters?.campaignId && filters.campaignId !== 'ALL') {
            filtered = filtered.filter((r) => r.campaignId === filters.campaignId);
        }
        if (filters?.status && filters.status !== 'ALL') {
            filtered = filtered.filter((r) => r.status === filters.status);
        }
        if (filters?.search && filters.search.trim()) {
            const q = filters.search.trim().toLowerCase();
            filtered = filtered.filter((r) => r.senderName.toLowerCase().includes(q) ||
                r.senderPhone.toLowerCase().includes(q) ||
                r.replyText.toLowerCase().includes(q) ||
                r.templateTitle.toLowerCase().includes(q) ||
                r.questionText.toLowerCase().includes(q) ||
                (r.department || '').toLowerCase().includes(q));
        }
        const trackedQuestionsCount = this.outboundMemory.filter((o) => this.isTemplateReplyAllowed(o.templateId, o.templateName, o.allowReplies)).length;
        return {
            replies: filtered,
            countsByTemplate,
            totalReplies: allReplies.length,
            newRepliesCount,
            trackedQuestionsCount,
        };
    }
    static async updateReplyStatus(id, status, adminNote) {
        await this.init();
        const idx = this.repliesMemory.findIndex((r) => r.replyId === id || r.waMessageId === id);
        if (idx !== -1) {
            this.repliesMemory[idx] = {
                ...this.repliesMemory[idx],
                status,
                ...(adminNote !== undefined ? { adminNote } : {}),
            };
            persistJsonArray('vaati_replies.json', this.repliesMemory);
        }
        if (isMongoReady()) {
            try {
                const updated = await VaatiReply_js_1.VaatiReplyModel.findOneAndUpdate({ $or: [{ replyId: id }, { waMessageId: id }] }, {
                    $set: {
                        status,
                        ...(adminNote !== undefined ? { adminNote } : {}),
                    },
                }, { new: true }).lean();
                if (updated) {
                    return {
                        replyId: updated.replyId,
                        waMessageId: updated.waMessageId,
                        session: updated.session,
                        senderPhone: updated.senderPhone,
                        senderChatId: updated.senderChatId,
                        senderName: updated.senderName,
                        employeeId: updated.employeeId,
                        department: updated.department,
                        designation: updated.designation,
                        templateId: updated.templateId,
                        templateName: updated.templateName,
                        templateTitle: updated.templateTitle,
                        campaignId: updated.campaignId,
                        campaignTitle: updated.campaignTitle,
                        questionText: updated.questionText,
                        outboundWaMessageId: updated.outboundWaMessageId,
                        replyType: updated.replyType,
                        replyText: updated.replyText,
                        selectedOptions: updated.selectedOptions || [],
                        hasMedia: Boolean(updated.hasMedia),
                        mediaType: updated.mediaType,
                        quotedMatch: Boolean(updated.quotedMatch),
                        repliedAt: new Date(updated.repliedAt).toISOString(),
                        status: (updated.status || 'NEW'),
                        adminNote: updated.adminNote,
                    };
                }
            }
            catch { }
        }
        return idx !== -1 ? this.repliesMemory[idx] : null;
    }
    static async deleteReply(id) {
        await this.init();
        const before = this.repliesMemory.length;
        this.repliesMemory = this.repliesMemory.filter((r) => r.replyId !== id && r.waMessageId !== id);
        const removedLocal = this.repliesMemory.length < before;
        if (removedLocal) {
            persistJsonArray('vaati_replies.json', this.repliesMemory);
        }
        let removedDb = false;
        if (isMongoReady()) {
            try {
                const res = await VaatiReply_js_1.VaatiReplyModel.deleteOne({
                    $or: [{ replyId: id }, { waMessageId: id }],
                });
                removedDb = (res.deletedCount || 0) > 0;
            }
            catch { }
        }
        return removedLocal || removedDb;
    }
}
exports.VaatiReplyService = VaatiReplyService;
