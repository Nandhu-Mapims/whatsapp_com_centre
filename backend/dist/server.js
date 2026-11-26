"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const env_js_1 = require("./config/env.js");
const db_js_1 = require("./config/db.js");
const apiRoutes_js_1 = __importDefault(require("./routes/apiRoutes.js"));
const retryService_js_1 = require("./services/retryService.js");
const vaatiReplyService_js_1 = require("./services/vaatiReplyService.js");
const shortlinkController_js_1 = require("./controllers/shortlinkController.js");
const app = (0, express_1.default)();
// Security and utility middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json({ limit: '25mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '25mb' }));
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'HEALTHY',
        service: 'APH Connect API - Employee Communication Platform (MAPIMS Hospitals)',
        tagline: 'One Platform. Every Employee. Connected.',
        time: new Date().toISOString(),
        env: env_js_1.ENV.NODE_ENV,
    });
});
// Public shortlink redirection route (no authentication required)
app.get('/shortlinks/:alias', shortlinkController_js_1.handleShortlinkRedirect);
app.get('/s/:alias', shortlinkController_js_1.handleShortlinkRedirect);
// Mount modular API routes
app.use('/api', apiRoutes_js_1.default);
// Global Error Handler
app.use((err, req, res, next) => {
    console.error('[Global Error]', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
    });
});
// Start listening
async function startServer() {
    await (0, db_js_1.connectDB)();
    retryService_js_1.RetryService.init();
    vaatiReplyService_js_1.VaatiReplyService.initAutoSync();
    app.listen(env_js_1.ENV.PORT, () => {
        console.log(`[APH Connect Backend] Server running on http://localhost:${env_js_1.ENV.PORT}`);
        console.log(`[APH Connect Backend] Health endpoint available at http://localhost:${env_js_1.ENV.PORT}/api/health`);
    });
}
startServer();
