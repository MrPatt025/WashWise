import { Redis } from 'ioredis';
import env from './env.js';

let redis: Redis | null = null;

export function getRedis(): Redis {
    if (!redis) {
        redis = new Redis(env.REDIS_URL, {
            maxRetriesPerRequest: 3,
            lazyConnect: true,
        });

        redis.on('error', (err: Error) => {
            console.error('Redis connection error:', err);
        });

        redis.on('connect', () => {
            console.log('✅ Connected to Redis');
        });
    }
    return redis!;
}

export async function closeRedis(): Promise<void> {
    if (redis) {
        await redis.quit();
        redis = null;
    }
}

export default getRedis;
