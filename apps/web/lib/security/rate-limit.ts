type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

let lastCleanupAt = 0;

function cleanup(now: number) {
  if (now - lastCleanupAt < 30_000) return;
  lastCleanupAt = now;

  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  cleanup(now);

  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: limit - 1,
      retryAfterMs: windowMs,
      strategy: "memory-single-instance",
    };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(bucket.resetAt - now, 0),
      strategy: "memory-single-instance",
    };
  }

  bucket.count += 1;
  buckets.set(key, bucket);

  return {
    allowed: true,
    remaining: limit - bucket.count,
    retryAfterMs: Math.max(bucket.resetAt - now, 0),
    strategy: "memory-single-instance",
  };
}
