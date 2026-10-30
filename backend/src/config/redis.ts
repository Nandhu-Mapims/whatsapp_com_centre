import { Redis } from 'ioredis';
import { ENV } from './env.js';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(ENV.REDIS_URL, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 3) return null; // stop retry if redis not available
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
