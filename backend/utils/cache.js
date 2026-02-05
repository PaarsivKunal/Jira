import NodeCache from 'node-cache';

// Standard TTL 5 minutes (300 seconds)
const cache = new NodeCache({ stdTTL: 300 });

export const getCache = (key) => {
    return cache.get(key);
};

export const setCache = (key, value, ttl) => {
    return cache.set(key, value, ttl);
};

export const clearCache = (keyPrefix) => {
    const keys = cache.keys();
    const matchingKeys = keys.filter((key) => key.startsWith(keyPrefix));
    cache.del(matchingKeys);
};

export default cache;
