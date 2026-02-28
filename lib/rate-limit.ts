interface RateLimitOptions {
  interval: number;
  limit: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
}

export function rateLimit({ interval, limit }: RateLimitOptions) {
  const timestamps = new Map<string, number[]>();

  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, times] of timestamps) {
      const valid = times.filter((t) => now - t < interval);
      if (valid.length === 0) {
        timestamps.delete(key);
      } else {
        timestamps.set(key, valid);
      }
    }
  }, 60_000);

  if (typeof cleanup === "object" && "unref" in cleanup) {
    cleanup.unref();
  }

  return {
    check(key: string): RateLimitResult {
      const now = Date.now();
      const times = timestamps.get(key) ?? [];
      const valid = times.filter((t) => now - t < interval);

      if (valid.length >= limit) {
        timestamps.set(key, valid);
        return { success: false, remaining: 0 };
      }

      valid.push(now);
      timestamps.set(key, valid);
      return { success: true, remaining: limit - valid.length };
    },
  };
}
