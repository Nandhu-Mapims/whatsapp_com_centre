"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
const mongoose_1 = __importDefault(require("mongoose"));
const env_js_1 = require("./env.js");
async function connectDB() {
    try {
        await mongoose_1.default.connect(env_js_1.ENV.MONGO_URI, {
            serverSelectionTimeoutMS: 3000,
        });
        console.log('[Database] MongoDB connected successfully to MAPIMS cluster.');
    }
    catch (err) {
        console.warn(`[Database] MongoDB connection notice: ${err.message}. Running in memory fallback mode if required.`);
    }
}
