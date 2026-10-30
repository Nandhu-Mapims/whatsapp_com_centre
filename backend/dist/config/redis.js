"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedisClient = getRedisClient;
const ioredis_1 = require("ioredis");
const env_js_1 = require("./env.js");
let redisClient = null;
function getRedisClient() {
    if (!redisClient) {
        redisClient = new ioredis_1.Redis(env_js_1.ENV.REDIS_URL, {
            maxRetriesPerRequest: null,
            lazyConnect: true,
            retryStrategy(times) {
                if (times > 3)
                    return null; // stop retry if redis not available
                return Math.min(times * 100, 1000);
            },
        });
        redisClient.on('error', (err) => {
            // Graceful error logging without crashing
            // console.warn('[Redis] Connection notice:', err.message);
        });
    }
    return redisClient;
}
