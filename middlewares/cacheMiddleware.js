const cache = new Map();

exports.cacheMiddleware = (durationSeconds = 60) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = req.originalUrl || req.url;
    const cached = cache.get(key);
    if (cached && Date.now() < cached.expiry) {
      console.log(`[Cache] Hit for key: ${key}`);
      // Set cached headers
      if (cached.headers) {
        Object.entries(cached.headers).forEach(([k, v]) => {
          res.setHeader(k, v);
        });
      }
      return res.status(cached.status).send(cached.body);
    }

    // Override res.send to capture and cache response
    const originalSend = res.send;
    res.send = function (body) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const headersToCache = {};
        const totalCount = res.getHeader('X-Total-Count');
        if (totalCount !== undefined) {
          headersToCache['X-Total-Count'] = totalCount;
          headersToCache['Access-Control-Expose-Headers'] = 'X-Total-Count';
        }

        cache.set(key, {
          body,
          status: res.statusCode,
          headers: headersToCache,
          expiry: Date.now() + (durationSeconds * 1000)
        });
      }
      return originalSend.apply(res, arguments);
    };

    next();
  };
};

exports.invalidateCache = () => {
  if (cache.size > 0) {
    console.log(`[Cache] Invalidating ${cache.size} cache keys due to data write`);
    cache.clear();
  }
};

exports.cacheInvalidator = (req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    exports.invalidateCache();
  }
  next();
};
