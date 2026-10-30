import { Queue, Worker, Job } from 'bullmq';
import { getRedisClient } from '../config/redis.js';

export class QueueService {
  private static messageQueue: Queue | null = null;

  public static getMessageQueue(): Queue {
    if (!this.messageQueue) {
      const connection = getRedisClient();
      this.messageQueue = new Queue('hospital-whatsapp-messages', {
        connection: connection as any,
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

  public static async scheduleCampaignJob(campaignId: string, scheduledDate: Date) {
    try {
      const queue = this.getMessageQueue();
      const delay = Math.max(0, scheduledDate.getTime() - Date.now());
      await queue.add(
        'dispatch-campaign',
        { campaignId },
        { delay, jobId: `campaign_${campaignId}` }
      );
      console.log(`[Queue] Campaign ${campaignId} scheduled with ${delay}ms delay.`);
    } catch (err: any) {
      console.warn(`[Queue] Fallback: Redis offline, scheduled in local timer.`);
    }
  }
}
