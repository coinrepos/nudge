// Simple TTL cache for search results — avoids hitting SerpAPI for repeated queries
const cache = new Map();
const DEFAULT_TTL = 60_000; // 60 seconds

export function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

export function setCached(key, data, ttl = DEFAULT_TTL) {
  // Prevent cache from growing unbounded
  if (cache.size > 500) {
    // Evict oldest entries
    const now = Date.now();
    for (const [k, v] of cache) {
      if (now > v.expiresAt) cache.delete(k);
    }
    // If still too big, clear half
    if (cache.size > 500) {
      const keys = [...cache.keys()];
      keys.slice(0, Math.floor(keys.length / 2)).forEach(k => cache.delete(k));
    }
  }
  cache.set(key, { data, expiresAt: Date.now() + ttl });
}

export function makeCacheKey(query, keywords, counts) {
  const kw = keywords ? [...keywords].sort().join(',') : '';
  const ct = counts ? JSON.stringify(counts) : '';
  return `search:${query}:${kw}:${ct}`;
}
