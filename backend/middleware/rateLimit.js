/**
 * Lightweight in-memory rate limiter (no external dependency).
 *
 * NOTE: In serverless/multi-instance deployments each instance has its own
 * bucket. For strict global limits, swap the Map for Redis/Upstash later.
 */
const buckets = new Map(); // key -> { count, resetAt }

// Periodic cleanup so the map doesn't grow forever
setInterval(() => {
  const now = Date.now();
  for (const [key, b] of buckets) {
    if (now > b.resetAt) buckets.delete(key);
  }
}, 60 * 1000).unref?.();

/**
 * @param {object} opts
 * @param {number} opts.windowMs  - time window in ms (default 15 min)
 * @param {number} opts.max       - max requests per window per key (default 100)
 * @param {string} opts.prefix    - bucket prefix to separate limiters
 */
const rateLimit = ({ windowMs = 15 * 60 * 1000, max = 100, prefix = 'global' } = {}) => {
  return (req, res, next) => {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const key = `${prefix}:${ip}`;
    const now = Date.now();

    let bucket = buckets.get(key);
    if (!bucket || now > bucket.resetAt) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count++;

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - bucket.count));

    if (bucket.count > max) {
      res.setHeader('Retry-After', Math.ceil((bucket.resetAt - now) / 1000));
      return res.status(429).json({
        message: 'Too many requests. Please wait a few minutes and try again.'
      });
    }
    next();
  };
};

module.exports = { rateLimit };
