const generalRequests = new Map(); // key: ip, value: array of timestamps
const formRequests = new Map(); // key: ip, value: array of timestamps

const GENERAL_LIMIT = 100;
const GENERAL_WINDOW_MS = 60 * 1000; // 1 minute

const FORM_LIMIT = 10;
const FORM_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

exports.generalRateLimiter = (req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const now = Date.now();

  if (!generalRequests.has(ip)) {
    generalRequests.set(ip, []);
  }

  let timestamps = generalRequests.get(ip);
  timestamps = timestamps.filter(t => now - t < GENERAL_WINDOW_MS);

  if (timestamps.length >= GENERAL_LIMIT) {
    return res.status(429).json({
      message: 'Too many requests. Please try again after a minute.'
    });
  }

  timestamps.push(now);
  generalRequests.set(ip, timestamps);
  next();
};

exports.formRateLimiter = (req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const now = Date.now();

  if (!formRequests.has(ip)) {
    formRequests.set(ip, []);
  }

  let timestamps = formRequests.get(ip);
  timestamps = timestamps.filter(t => now - t < FORM_WINDOW_MS);
  
  if (timestamps.length >= FORM_LIMIT) {
    const oldest = timestamps[0];
    const waitTimeMs = FORM_WINDOW_MS - (now - oldest);
    const waitMinutes = Math.ceil(waitTimeMs / 60000);
    return res.status(429).json({
      message: `Too many submissions. Please try again after ${waitMinutes} minutes.`
    });
  }

  timestamps.push(now);
  formRequests.set(ip, timestamps);
  next();
};
