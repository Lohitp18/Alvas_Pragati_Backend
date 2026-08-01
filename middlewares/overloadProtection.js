let requestCount = 0;
let windowStart = Date.now();
const WINDOW_DURATION_MS = 10000; // 10 seconds sliding window
const MAX_REQUESTS_IN_WINDOW = 250; // Threshold
const BLOCK_DURATION_MS = 30000; // Block requests for 30 seconds if triggered

let isBlocked = false;
let blockedUntil = 0;

module.exports = (req, res, next) => {
  const now = Date.now();

  // Check if currently blocked
  if (isBlocked) {
    if (now < blockedUntil) {
      const secondsLeft = Math.ceil((blockedUntil - now) / 1000);
      return res.status(503).json({
        message: `Server is temporarily overloaded and blocking requests. Please try again in ${secondsLeft} seconds.`
      });
    } else {
      // Lift block
      isBlocked = false;
      blockedUntil = 0;
      requestCount = 0;
      windowStart = now;
      console.log('[Overload Protection] Server block lifted.');
    }
  }

  // Slide window
  if (now - windowStart > WINDOW_DURATION_MS) {
    requestCount = 0;
    windowStart = now;
  }

  requestCount++;

  // Trigger block if exceeded
  if (requestCount > MAX_REQUESTS_IN_WINDOW) {
    isBlocked = true;
    blockedUntil = now + BLOCK_DURATION_MS;
    console.warn(`[Overload Protection] Warning: ${requestCount} requests exceeded limit of ${MAX_REQUESTS_IN_WINDOW} in 10s. Blocking requests for 30s.`);
    return res.status(503).json({
      message: 'Server is temporarily overloaded and blocking requests. Please try again in 30 seconds.'
    });
  }

  next();
};
