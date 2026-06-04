interface RateLimitRecord {
  count: number;
  expiresAt: number;
}

const cache = new Map<string, RateLimitRecord>();

// Clean up expired cache items every 5 minutes to prevent memory leaks
if (typeof global !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    cache.forEach((record, key) => {
      if (now > record.expiresAt) {
        cache.delete(key);
      }
    });
  }, 5 * 60 * 1000).unref?.(); // Use unref if available in Node.js to not keep the process active
}

/**
 * Validates request rates for a specific key/IP
 * @param key unique identifier (usually client IP)
 * @param limit maximum allowed requests
 * @param windowMs time window in milliseconds (e.g., 60000 for 1 minute)
 */
export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const record = cache.get(key);

  if (!record) {
    cache.set(key, { count: 1, expiresAt: now + windowMs });
    return { success: true, count: 1, limit };
  }

  if (now > record.expiresAt) {
    cache.set(key, { count: 1, expiresAt: now + windowMs });
    return { success: true, count: 1, limit };
  }

  record.count += 1;
  if (record.count > limit) {
    return { success: false, count: record.count - 1, limit };
  }

  return { success: true, count: record.count, limit };
}
