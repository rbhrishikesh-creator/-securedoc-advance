import Redis from 'ioredis';
import { config } from './env';

class FallbackMemoryStore {
  private store = new Map<string, { value: string; expiresAt: number | null }>();

  async set(key: string, value: string, mode?: string, duration?: number): Promise<'OK' | null> {
    let expiresAt: number | null = null;
    if (mode === 'EX' && duration) {
      expiresAt = Date.now() + duration * 1000;
    } else if (mode === 'PX' && duration) {
      expiresAt = Date.now() + duration;
    }
    this.store.set(key, { value, expiresAt });
    return 'OK';
  }

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }

  // Atomic get and delete (single-use token consumption)
  async getdel(key: string): Promise<string | null> {
    const val = await this.get(key);
    if (val !== null) {
      this.store.delete(key);
    }
    return val;
  }

  async incr(key: string): Promise<number> {
    const current = await this.get(key);
    const next = (current ? parseInt(current, 10) : 0) + 1;
    const entry = this.store.get(key);
    this.store.set(key, {
      value: next.toString(),
      expiresAt: entry?.expiresAt ?? null,
    });
    return next;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return 0;
    entry.expiresAt = Date.now() + seconds * 1000;
    return 1;
  }
}

export interface ICacheClient {
  set(key: string, value: string, mode?: string, duration?: number): Promise<'OK' | null>;
  get(key: string): Promise<string | null>;
  del(key: string): Promise<number>;
  getdel(key: string): Promise<string | null>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
}

let redisClient: Redis | null = null;
const memoryStore = new FallbackMemoryStore();
let isRedisAvailable = false;

// During Jest testing, use the high-performance memory store directly to prevent open TCP handles
if (process.env.NODE_ENV !== 'test') {
  try {
    redisClient = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
      lazyConnect: true,
    });

    redisClient
      .connect()
      .then(() => {
        isRedisAvailable = true;
        console.log(`[Redis] Connected successfully to ${config.redisUrl}`);
      })
      .catch((err) => {
        isRedisAvailable = false;
        console.warn(`[Redis Warning] Redis unavailable (${err.message}). Using high-performance in-memory cache & atomic token store.`);
      });

    redisClient.on('error', () => {
      isRedisAvailable = false;
    });
  } catch {
    isRedisAvailable = false;
  }
}

export const cacheStore: ICacheClient = {
  async set(key: string, value: string, mode?: string, duration?: number): Promise<'OK' | null> {
    if (isRedisAvailable && redisClient) {
      try {
        if (mode && duration) {
          return await (redisClient as any).set(key, value, mode, duration);
        }
        return await redisClient.set(key, value);
      } catch {
        // fallback
      }
    }
    return memoryStore.set(key, value, mode, duration);
  },

  async get(key: string): Promise<string | null> {
    if (isRedisAvailable && redisClient) {
      try {
        return await redisClient.get(key);
      } catch {
        // fallback
      }
    }
    return memoryStore.get(key);
  },

  async del(key: string): Promise<number> {
    if (isRedisAvailable && redisClient) {
      try {
        return await redisClient.del(key);
      } catch {
        // fallback
      }
    }
    return memoryStore.del(key);
  },

  /**
   * Atomic GETDEL: Retrieves and removes key in a single atomic step.
   * If Redis >= 6.2, uses GETDEL command; otherwise evaluates Lua script.
   */
  async getdel(key: string): Promise<string | null> {
    if (isRedisAvailable && redisClient) {
      try {
        const luaScript = `
          local val = redis.call('get', KEYS[1])
          if val then
            redis.call('del', KEYS[1])
          end
          return val
        `;
        return (await redisClient.eval(luaScript, 1, key)) as string | null;
      } catch {
        // fallback
      }
    }
    return memoryStore.getdel(key);
  },

  async incr(key: string): Promise<number> {
    if (isRedisAvailable && redisClient) {
      try {
        return await redisClient.incr(key);
      } catch {
        // fallback
      }
    }
    return memoryStore.incr(key);
  },

  async expire(key: string, seconds: number): Promise<number> {
    if (isRedisAvailable && redisClient) {
      try {
        return await redisClient.expire(key, seconds);
      } catch {
        // fallback
      }
    }
    return memoryStore.expire(key, seconds);
  },
};
