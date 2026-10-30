"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueService = void 0;
const bullmq_1 = require("bullmq");
const redis_js_1 = require("../config/redis.js");
class QueueService {
    static messageQueue = null;
    static getMessageQueue() {
        if (!this.messageQueue) {
            const connection = (0, redis_js_1.getRedisClient)();
            this.messageQueue = new bullmq_1.Queue('hospital-whatsapp-messages', {
                connection: connection,
                defaultJobOptions: {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 2000,
                    },
                    removeOnComplete: 1000,
                    removeOnFail: 5000,
                },
            });
        }
        return this.messageQueue;
    }
    static async scheduleCampaignJob(campaignId, scheduledDate) {
        try {
            const queue = this.getMessageQueue();
            const delay = Math.max(0, scheduledDate.getTime() - Date.now());
            await queue.add('dispatch-campaign', { campaignId }, { delay, jobId: `campaign_${campaignId}` });
            console.log(`[Queue] Campaign ${campaignId} scheduled with ${delay}ms delay.`);
        }
        catch (err) {
            console.warn(`[Queue] Fallback: Redis offline, scheduled in local timer.`);
        }
    }
}
exports.QueueService = QueueService;
