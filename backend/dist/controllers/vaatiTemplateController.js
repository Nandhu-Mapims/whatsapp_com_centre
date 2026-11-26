"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testSendVaatiTemplate = exports.toggleVaatiTemplateReply = exports.deleteVaatiTemplate = exports.updateVaatiTemplate = exports.createVaatiTemplate = exports.getVaatiTemplateById = exports.getVaatiTemplates = exports.parseVariablesFromBody = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const vaatiService_js_1 = require("../services/vaatiService.js");
const vaatiReplyService_js_1 = require("../services/vaatiReplyService.js");
const phoneUtils_js_1 = require("../utils/phoneUtils.js");
const getVaatiTemplatesCandidatePaths = () => [
    path_1.default.resolve(process.cwd(), 'backend/src/data/vaati_templates.json'),
    path_1.default.resolve(process.cwd(), 'backend/dist/data/vaati_templates.json'),
    path_1.default.resolve(process.cwd(), 'src/data/vaati_templates.json'),
    path_1.default.resolve(process.cwd(), 'dist/data/vaati_templates.json'),
    path_1.default.resolve(__dirname, '../data/vaati_templates.json'),
    path_1.default.resolve(__dirname, '../../src/data/vaati_templates.json'),
    path_1.default.resolve(__dirname, '../../dist/data/vaati_templates.json'),
];
let vaatiTemplatesStore = [];
for (const cPath of getVaatiTemplatesCandidatePaths()) {
    try {
        if (fs_1.default.existsSync(cPath)) {
            const parsed = JSON.parse(fs_1.default.readFileSync(cPath, 'utf8'));
            if (Array.isArray(parsed) && parsed.length > 0) {
                vaatiTemplatesStore = parsed;
                console.log(`[VAATI Templates] Loaded ${vaatiTemplatesStore.length} templates from ${cPath}`);
                break;
            }
        }
    }
    catch (err) {
        console.warn(`[VAATI Templates] Error loading ${cPath}:`, err.message);
    }
}
const persistVaatiTemplates = () => {
    getVaatiTemplatesCandidatePaths().forEach((cp) => {
        try {
            if (fs_1.default.existsSync(path_1.default.dirname(cp))) {
                fs_1.default.writeFileSync(cp, JSON.stringify(vaatiTemplatesStore, null, 2));
            }
        }
        catch { }
    });
};
const parseVariablesFromBody = (body) => {
    const matches = body.match(/\{\{([a-zA-Z0-9_.-]+)\}\}/g) || [];
    const keys = Array.from(new Set(matches.map((m) => m.replace(/[{}]/g, '').trim())));
    return keys.map((key) => ({
        key,
        description: key.replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        sampleValue: key.includes('url') || key.includes('link')
            ? 'https://inc.mapims.edu.in/login'
            : key.includes('name')
                ? 'Staff Member'
                : `Sample ${key}`,
    }));
};
exports.parseVariablesFromBody = parseVariablesFromBody;
/**
 * List all VAATI custom templates
 */
const getVaatiTemplates = (req, res) => {
    try {
        const { q, category } = req.query;
        let results = [...vaatiTemplatesStore];
        if (category && typeof category === 'string' && category !== 'All') {
            results = results.filter((t) => t.category.toLowerCase() === category.toLowerCase());
        }
        if (q && typeof q === 'string') {
            const search = q.toLowerCase();
            results = results.filter((t) => t.title.toLowerCase().includes(search) ||
                t.name.toLowerCase().includes(search) ||
                t.body.toLowerCase().includes(search) ||
                t.category.toLowerCase().includes(search));
        }
        res.json({
            success: true,
            count: results.length,
            data: results,
            totalCount: vaatiTemplatesStore.length,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.getVaatiTemplates = getVaatiTemplates;
/**
 * Get single VAATI template by ID
 */
const getVaatiTemplateById = (req, res) => {
    const { id } = req.params;
    const tmpl = vaatiTemplatesStore.find((t) => t.id === id || t.name === id);
    if (!tmpl) {
        return res.status(404).json({ success: false, message: 'VAATI template not found.' });
    }
    res.json({ success: true, data: tmpl });
};
exports.getVaatiTemplateById = getVaatiTemplateById;
/**
 * Create a new VAATI template
 */
const resolveVaatiMessageType = (rawType, cleanOptions, mediaUrl, ctaUrl) => {
    if (rawType === 'text' || rawType === 'url_text' || rawType === 'image_text' || rawType === 'pdf_text' || rawType === 'poll') {
        return rawType;
    }
    if (cleanOptions.length >= 2)
        return 'poll';
    if (mediaUrl)
        return mediaUrl.toLowerCase().includes('.pdf') || mediaUrl.includes('application/pdf') ? 'pdf_text' : 'image_text';
    if (ctaUrl)
        return 'url_text';
    return 'text';
};
const createVaatiTemplate = (req, res) => {
    try {
        const { name, title, category, messageType, header, body, footer, ctaUrl, mediaUrl, mediaFilename, mediaMimetype, pollOptions, multipleAnswers, allowReplies, replyPrompt, variables, } = req.body;
        if (!title || !title.trim()) {
            return res.status(400).json({ success: false, message: 'Template title is required.' });
        }
        if (!body || !body.trim()) {
            return res.status(400).json({ success: false, message: 'Template body content is required.' });
        }
        const cleanOptions = Array.isArray(pollOptions)
            ? pollOptions.map((o) => String(o).trim()).filter(Boolean)
            : [];
        const resolvedType = resolveVaatiMessageType(messageType, cleanOptions, mediaUrl, ctaUrl);
        if (resolvedType === 'poll' && cleanOptions.length < 2) {
            return res.status(400).json({ success: false, message: 'Please provide at least 2 response button options for a 1-Tap Poll template.' });
        }
        if ((resolvedType === 'image_text' || resolvedType === 'pdf_text') && (!mediaUrl || !String(mediaUrl).trim())) {
            return res.status(400).json({ success: false, message: `Please attach or provide a ${resolvedType === 'pdf_text' ? 'PDF document' : 'image'} URL/file.` });
        }
        // Auto-generate slug name if not provided
        const cleanName = (name && name.trim()) ||
            'vaati_' +
                title
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '_')
                    .replace(/^_+|_+$/g, '');
        // Check for duplicate name
        if (vaatiTemplatesStore.some((t) => t.name === cleanName)) {
            return res.status(400).json({
                success: false,
                message: `A VAATI template with identifier "${cleanName}" already exists. Please choose a different title or identifier.`,
            });
        }
        const parsedVars = Array.isArray(variables) && variables.length > 0
            ? variables
            : (0, exports.parseVariablesFromBody)(body);
        const nowStr = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        })
            .format(new Date())
            .replace(', ', ' ');
        const newTemplate = {
            id: `v-tmpl-${Date.now()}`,
            name: cleanName,
            title: title.trim(),
            category: category || 'Hospital Applications',
            messageType: resolvedType,
            header: header ? header.trim() : undefined,
            body: body.trim(),
            footer: footer ? footer.trim() : 'Melmaruvathur Adhiparasakthi Institute of Medical Sciences (MAPIMS)',
            ctaUrl: resolvedType === 'url_text' && ctaUrl ? String(ctaUrl).trim() : undefined,
            mediaUrl: (resolvedType === 'image_text' || resolvedType === 'pdf_text') && mediaUrl ? String(mediaUrl).trim() : undefined,
            mediaFilename: (resolvedType === 'image_text' || resolvedType === 'pdf_text') && mediaFilename ? String(mediaFilename).trim() : undefined,
            mediaMimetype: (resolvedType === 'image_text' || resolvedType === 'pdf_text') && mediaMimetype ? String(mediaMimetype).trim() : undefined,
            pollOptions: resolvedType === 'poll' ? cleanOptions : undefined,
            multipleAnswers: resolvedType === 'poll' ? Boolean(multipleAnswers) : undefined,
            allowReplies: Boolean(allowReplies),
            replyPrompt: Boolean(allowReplies)
                ? (replyPrompt && String(replyPrompt).trim()) ||
                    '💬 Reply directly to this message to submit your response.'
                : undefined,
            variables: parsedVars,
            status: 'ACTIVE',
            createdBy: req.user?.name || 'Authorized Staff',
            createdAt: nowStr,
            updatedAt: nowStr,
        };
        vaatiTemplatesStore.unshift(newTemplate);
        persistVaatiTemplates();
        vaatiReplyService_js_1.VaatiReplyService.setTemplateReplySetting(newTemplate.id, newTemplate.name, Boolean(newTemplate.allowReplies));
        console.log(`[VAATI Templates] Created new template "${newTemplate.title}" (${newTemplate.name})`);
        res.status(201).json({
            success: true,
            message: `VAATI Template "${newTemplate.title}" created successfully!`,
            data: newTemplate,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.createVaatiTemplate = createVaatiTemplate;
/**
 * Update an existing VAATI template
 */
const updateVaatiTemplate = (req, res) => {
    try {
        const { id } = req.params;
        const index = vaatiTemplatesStore.findIndex((t) => t.id === id || t.name === id);
        if (index === -1) {
            return res.status(404).json({ success: false, message: 'VAATI template not found.' });
        }
        const existing = vaatiTemplatesStore[index];
        const { title, category, messageType, header, body, footer, ctaUrl, mediaUrl, mediaFilename, mediaMimetype, pollOptions, multipleAnswers, allowReplies, replyPrompt, variables, status, } = req.body;
        const updatedBody = body !== undefined ? body.trim() : existing.body;
        const updatedVars = variables !== undefined
            ? variables
            : body !== undefined
                ? (0, exports.parseVariablesFromBody)(updatedBody)
                : existing.variables;
        const cleanOptions = Array.isArray(pollOptions)
            ? pollOptions.map((o) => String(o).trim()).filter(Boolean)
            : existing.pollOptions || [];
        const updatedType = messageType !== undefined
            ? resolveVaatiMessageType(messageType, cleanOptions, mediaUrl ?? existing.mediaUrl, ctaUrl ?? existing.ctaUrl)
            : existing.messageType || resolveVaatiMessageType(undefined, cleanOptions, existing.mediaUrl, existing.ctaUrl);
        const nowStr = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        })
            .format(new Date())
            .replace(', ', ' ');
        const updated = {
            ...existing,
            title: title !== undefined ? title.trim() : existing.title,
            category: category !== undefined ? category : existing.category,
            messageType: updatedType,
            header: header !== undefined ? (header ? header.trim() : undefined) : existing.header,
            body: updatedBody,
            footer: footer !== undefined ? footer.trim() : existing.footer,
            ctaUrl: updatedType === 'url_text' ? (ctaUrl !== undefined ? String(ctaUrl).trim() : existing.ctaUrl) : undefined,
            mediaUrl: updatedType === 'image_text' || updatedType === 'pdf_text' ? (mediaUrl !== undefined ? String(mediaUrl).trim() : existing.mediaUrl) : undefined,
            mediaFilename: updatedType === 'image_text' || updatedType === 'pdf_text' ? (mediaFilename !== undefined ? String(mediaFilename).trim() : existing.mediaFilename) : undefined,
            mediaMimetype: updatedType === 'image_text' || updatedType === 'pdf_text' ? (mediaMimetype !== undefined ? String(mediaMimetype).trim() : existing.mediaMimetype) : undefined,
            pollOptions: updatedType === 'poll' ? cleanOptions : undefined,
            multipleAnswers: updatedType === 'poll' ? (multipleAnswers !== undefined ? Boolean(multipleAnswers) : existing.multipleAnswers) : undefined,
            allowReplies: allowReplies !== undefined ? Boolean(allowReplies) : Boolean(existing.allowReplies),
            replyPrompt: (allowReplies !== undefined ? Boolean(allowReplies) : Boolean(existing.allowReplies))
                ? (replyPrompt !== undefined
                    ? String(replyPrompt).trim() || '💬 Reply directly to this message to submit your response.'
                    : existing.replyPrompt || '💬 Reply directly to this message to submit your response.')
                : undefined,
            variables: updatedVars,
            status: status !== undefined ? status : existing.status,
            updatedAt: nowStr,
        };
        vaatiTemplatesStore[index] = updated;
        persistVaatiTemplates();
        vaatiReplyService_js_1.VaatiReplyService.setTemplateReplySetting(updated.id, updated.name, Boolean(updated.allowReplies));
        console.log(`[VAATI Templates] Updated template "${updated.title}" (${updated.name})`);
        res.json({
            success: true,
            message: `VAATI Template "${updated.title}" updated successfully!`,
            data: updated,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.updateVaatiTemplate = updateVaatiTemplate;
/**
 * Delete a VAATI template
 */
const deleteVaatiTemplate = (req, res) => {
    try {
        const { id } = req.params;
        const index = vaatiTemplatesStore.findIndex((t) => t.id === id || t.name === id);
        if (index === -1) {
            return res.status(404).json({ success: false, message: 'VAATI template not found.' });
        }
        const removed = vaatiTemplatesStore.splice(index, 1)[0];
        persistVaatiTemplates();
        console.log(`[VAATI Templates] Deleted template "${removed.title}" (${removed.name})`);
        res.json({
            success: true,
            message: `VAATI Template "${removed.title}" deleted successfully.`,
            deletedId: removed.id,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.deleteVaatiTemplate = deleteVaatiTemplate;
/**
 * Toggle Reply ON / OFF for a VAATI template question
 */
const toggleVaatiTemplateReply = (req, res) => {
    try {
        const { id } = req.params;
        const { allowReplies, replyPrompt } = req.body;
        const index = vaatiTemplatesStore.findIndex((t) => t.id === id || t.name === id);
        if (index === -1) {
            return res.status(404).json({ success: false, message: 'VAATI template not found.' });
        }
        const existing = vaatiTemplatesStore[index];
        const nextAllow = allowReplies !== undefined ? Boolean(allowReplies) : !Boolean(existing.allowReplies);
        const nowStr = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        })
            .format(new Date())
            .replace(', ', ' ');
        const updated = {
            ...existing,
            allowReplies: nextAllow,
            replyPrompt: nextAllow
                ? (replyPrompt !== undefined
                    ? String(replyPrompt).trim()
                    : existing.replyPrompt) || '💬 Reply directly to this message to submit your response.'
                : existing.replyPrompt,
            updatedAt: nowStr,
        };
        vaatiTemplatesStore[index] = updated;
        persistVaatiTemplates();
        vaatiReplyService_js_1.VaatiReplyService.setTemplateReplySetting(updated.id, updated.name, nextAllow);
        console.log(`[VAATI Templates] Replies ${nextAllow ? 'ENABLED (ON)' : 'DISABLED (OFF)'} for "${updated.title}"`);
        res.json({
            success: true,
            message: `Replies turned ${nextAllow ? 'ON' : 'OFF'} for "${updated.title}".`,
            data: updated,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.toggleVaatiTemplateReply = toggleVaatiTemplateReply;
/**
 * Direct Test Send for VAATI Template
 */
const testSendVaatiTemplate = async (req, res) => {
    try {
        let { whatsappNumber, targetPhone, templateId, body, variables, values, messageType, ctaUrl, mediaUrl, mediaFilename, mediaMimetype, pollOptions, multipleAnswers, footer, allowReplies, replyPrompt, session, } = req.body;
        whatsappNumber = whatsappNumber || targetPhone;
        if (!whatsappNumber) {
            return res.status(400).json({ success: false, message: 'WhatsApp phone number is required.' });
        }
        let matchedTmpl;
        if (templateId) {
            matchedTmpl = vaatiTemplatesStore.find((t) => t.id === templateId || t.name === templateId);
            if (matchedTmpl) {
                if (!body)
                    body = matchedTmpl.body;
                if (footer === undefined)
                    footer = matchedTmpl.footer;
                variables = variables || matchedTmpl.variables;
                if (!messageType)
                    messageType = matchedTmpl.messageType;
                if (!ctaUrl)
                    ctaUrl = matchedTmpl.ctaUrl;
                if (!mediaUrl)
                    mediaUrl = matchedTmpl.mediaUrl;
                if (!mediaFilename)
                    mediaFilename = matchedTmpl.mediaFilename;
                if (!mediaMimetype)
                    mediaMimetype = matchedTmpl.mediaMimetype;
                if (!pollOptions)
                    pollOptions = matchedTmpl.pollOptions;
                if (multipleAnswers === undefined)
                    multipleAnswers = matchedTmpl.multipleAnswers;
                if (allowReplies === undefined)
                    allowReplies = matchedTmpl.allowReplies;
                if (replyPrompt === undefined)
                    replyPrompt = matchedTmpl.replyPrompt;
            }
        }
        if (!body) {
            return res.status(400).json({ success: false, message: 'Template message body is required.' });
        }
        if (!vaatiService_js_1.VaatiService.isEnabled()) {
            return res.status(400).json({
                success: false,
                message: 'VAATI Gateway is currently turned OFF. Please turn ON VAATI in the gateway panel first.',
            });
        }
        const norm = (0, phoneUtils_js_1.normalizePhoneNumber)(whatsappNumber);
        if (!norm.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid 10-digit WhatsApp number.',
            });
        }
        // Substitute values into body
        let renderedText = body;
        const valMap = values || {};
        if (Array.isArray(variables)) {
            variables.forEach((v) => {
                const k = v.key || v;
                const val = valMap[k] !== undefined && valMap[k] !== '' ? valMap[k] : v.sampleValue || `[${k}]`;
                renderedText = renderedText.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), val);
            });
        }
        else {
            Object.keys(valMap).forEach((k) => {
                renderedText = renderedText.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), valMap[k]);
            });
        }
        // Append footer formatted in WhatsApp _italic_ (for non-poll messages; polls stay concise)
        const cleanOptions = Array.isArray(pollOptions)
            ? pollOptions.map((o) => String(o).trim()).filter(Boolean)
            : [];
        const resolvedType = resolveVaatiMessageType(messageType, cleanOptions, mediaUrl, ctaUrl);
        if (resolvedType !== 'poll' && Boolean(allowReplies) && replyPrompt && String(replyPrompt).trim()) {
            const italicHint = vaatiService_js_1.VaatiService.formatItalicFooter(String(replyPrompt).trim());
            if (italicHint && !renderedText.includes(String(replyPrompt).trim()) && !renderedText.includes(italicHint)) {
                renderedText += `\n\n${italicHint}`;
            }
        }
        const italicFooter = resolvedType !== 'poll' ? vaatiService_js_1.VaatiService.formatItalicFooter(footer) : '';
        if (italicFooter) {
            renderedText += `\n\n${italicFooter}`;
        }
        // Substitute variables into ctaUrl if present
        let resolvedCtaUrl = ctaUrl ? String(ctaUrl) : undefined;
        if (resolvedCtaUrl) {
            Object.keys(valMap).forEach((k) => {
                resolvedCtaUrl = resolvedCtaUrl.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), valMap[k]);
            });
        }
        console.log(`[VAATI Test] Dispatching ${resolvedType} preview to ${norm.e164}...`);
        const result = await vaatiService_js_1.VaatiService.dispatchMessage({
            whatsappNumber: norm.digits,
            text: renderedText,
            messageType: resolvedType,
            ctaUrl: resolvedCtaUrl,
            mediaUrl,
            mediaFilename,
            mediaMimetype,
            pollOptions: cleanOptions,
            multipleAnswers: Boolean(multipleAnswers),
            session,
            broadcastTitle: 'VAATI Template Test Send',
        });
        if (result.success) {
            await vaatiReplyService_js_1.VaatiReplyService.recordOutboundDispatch({
                waMessageId: result.providerMessageId,
                session,
                whatsappNumber: norm.digits,
                templateId: matchedTmpl?.id || templateId || 'custom_vaati_test',
                templateName: matchedTmpl?.name || templateId || 'custom_vaati_test',
                templateTitle: matchedTmpl?.title || 'VAATI Template Test Question',
                messageType: resolvedType,
                sentText: renderedText,
                allowReplies: Boolean(allowReplies),
                replyPrompt: replyPrompt ? String(replyPrompt) : undefined,
                sentBy: req.user?.name || 'Authorized Staff',
            });
            res.json({
                success: true,
                message: `Test (${resolvedType}) successfully delivered to +${norm.digits} via VAATI!`,
                providerMessageId: result.providerMessageId,
                renderedText,
                allowReplies: Boolean(allowReplies),
            });
        }
        else {
            res.status(500).json({
                success: false,
                message: result.error || 'Failed to dispatch test message via VAATI gateway.',
            });
        }
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
exports.testSendVaatiTemplate = testSendVaatiTemplate;
