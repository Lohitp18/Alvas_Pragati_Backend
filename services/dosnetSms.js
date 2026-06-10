const https = require('https');
const { URL } = require('url');

/**
 * DOSNET DLT template variables (in order):
 * 1. {#alphanumeric#} → candidate name
 * 2. {#numeric#}       → 2026 (Pragati event year)
 * 3. {#numeric#}       → unique registration number (000001)
 *
 * Template text:
 * Dear {#alphanumeric#}, Thank you for registering for Alva's Pragati {#numeric#}.
 * Your registration is confirmed and your registration number is {#numeric#}
 * Best wishes from team Alva's Pragati Visit: www.alvaspragati.com -Alvas
 */

function normalizeIndianMobile(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  return digits;
}

/** Variable 1 — {#alphanumeric#} */
function getTemplateVar1Name(fullName) {
  const name = (fullName || 'Candidate').trim();
  return name.replace(/[^a-zA-Z0-9\s]/g, '').trim().slice(0, 30) || 'Candidate';
}

function getTemplateVariables(fullName, serialNumber) {
  const var1Name = getTemplateVar1Name(fullName);
  const var2Year = String(process.env.PRAGATI_EVENT_YEAR || '2026');
  const var3RegNumber = serialNumber;

  return { var1Name, var2Year, var3RegNumber };
}

function buildRegistrationMessage({ var1Name, var2Year, var3RegNumber }) {
  return (
    `Dear ${var1Name}, Thank you for registering for Alva's Pragati ${var2Year}. ` +
    `Your registration is confirmed and your registration number is ${var3RegNumber} ` +
    `Best wishes from team Alva's Pragati Visit: www.alvaspragati.com -Alvas`
  );
}

function getDosnetApiKey() {
  return String(
    process.env.DOSNET_API_KEY ||
      process.env.DOSNET_APIKEY ||
      process.env.DOSNET_KEY ||
      ''
  ).trim();
}

function getDosnetConfig() {
  return {
    apiUrl: String(process.env.DOSNET_API_URL || '').trim(),
    apiKey: getDosnetApiKey(),
    username: String(process.env.DOSNET_USERNAME || '').trim(),
    senderId: String(process.env.DOSNET_SENDERID || '').trim(),
    route: String(process.env.DOSNET_ROUTE || 'TRANS').trim(),
    templateId: String(process.env.DOSNET_TEMPLATE_ID || '').trim(),
  };
}

function isSmsConfigured() {
  const { apiUrl, apiKey, username, senderId } = getDosnetConfig();
  return Boolean(apiUrl && apiKey && username && senderId);
}

function getMissingDosnetVars() {
  const config = getDosnetConfig();
  const missing = [];
  if (!config.apiUrl) missing.push('DOSNET_API_URL');
  if (!config.apiKey) missing.push('DOSNET_API_KEY');
  if (!config.username) missing.push('DOSNET_USERNAME');
  if (!config.senderId) missing.push('DOSNET_SENDERID');
  return missing;
}

function parseDosnetResponse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

let cachedServerPublicIp = null;
let cachedServerPublicIpAt = 0;
const SERVER_IP_CACHE_MS = 10 * 60 * 1000;

function httpsGetText(url, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.get(
      {
        hostname: parsed.hostname,
        port: parsed.port || 443,
        path: `${parsed.pathname}${parsed.search}`,
        method: 'GET',
        headers: { 'User-Agent': 'AlvasPragati-Backend/1.0' },
        timeout: timeoutMs,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => resolve(data.trim()));
      }
    );
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
  });
}

function httpGetText(hostname, path, headers = {}, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    const http = require('http');
    const req = http.get(
      { hostname, port: 80, path, method: 'GET', headers, timeout: timeoutMs },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => resolve(data.trim()));
      }
    );
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
  });
}

async function getServerPublicIp() {
  const now = Date.now();
  if (cachedServerPublicIp && now - cachedServerPublicIpAt < SERVER_IP_CACHE_MS) {
    return cachedServerPublicIp;
  }

  const envIp = String(process.env.SERVER_PUBLIC_IP || process.env.DOSNET_WHITELIST_IP || '').trim();
  if (envIp) {
    cachedServerPublicIp = envIp;
    cachedServerPublicIpAt = now;
    return envIp;
  }

  const sources = [
    {
      name: 'Azure metadata',
      fn: () =>
        httpGetText(
          '169.254.169.254',
          '/metadata/instance/network/interface/0/ipv4/ipAddress/0/publicIpAddress?api-version=2021-02-01&format=text',
          { Metadata: 'true' },
          3000
        ),
    },
    {
      name: 'api.ipify.org',
      fn: () => httpsGetText('https://api.ipify.org', 5000),
    },
    {
      name: 'ifconfig.me',
      fn: () => httpsGetText('https://ifconfig.me/ip', 5000),
    },
  ];

  for (const source of sources) {
    try {
      const ip = await source.fn();
      if (/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) {
        cachedServerPublicIp = ip;
        cachedServerPublicIpAt = now;
        return ip;
      }
    } catch {
      // try next source
    }
  }

  return null;
}

function httpsGet(url, timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.get(
      {
        hostname: parsed.hostname,
        port: parsed.port || 443,
        path: `${parsed.pathname}${parsed.search}`,
        method: 'GET',
        headers: {
          'User-Agent': 'AlvasPragati-Backend/1.0',
          Accept: 'application/json, text/plain, */*',
        },
        timeout: timeoutMs,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({ status: res.statusCode || 0, text: data.trim() });
        });
      }
    );

    req.on('timeout', () => {
      req.destroy(new Error('SMS API request timed out after 12s'));
    });
    req.on('error', reject);
  });
}

async function callDosnetApi(url) {
  const requestOptions = {
    method: 'GET',
    headers: {
      'User-Agent': 'AlvasPragati-Backend/1.0',
      Accept: 'application/json, text/plain, */*',
    },
  };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(url, { ...requestOptions, signal: controller.signal });
    clearTimeout(timer);
    return { status: res.status, text: (await res.text()).trim() };
  } catch (fetchErr) {
    const cause = fetchErr.cause || {};
    console.warn('[DOSNET SMS] fetch() failed:', fetchErr.message);
    if (cause.message || cause.code) {
      console.warn('[DOSNET SMS] fetch cause:', cause.code || cause.message);
    }
    console.warn('[DOSNET SMS] Retrying with Node https module...');
    return httpsGet(url);
  }
}

function evaluateDosnetResponse(status, text) {
  const json = parseDosnetResponse(text);

  if (json?.status === 'error') {
    const message = json.message || text;
    const ipBlocked = /ip\s*blocked/i.test(message);
    return {
      sent: false,
      error: ipBlocked
        ? `${message}. Ask DOSNET to whitelist your server public IP (${json.ipaddress || 'unknown'}).`
        : message,
      status,
      ipBlocked,
      ipAddress: json.ipaddress || null,
      response: text,
    };
  }

  const lower = text.toLowerCase();
  const failed =
    status < 200 ||
    status >= 300 ||
    lower.includes('error') ||
    lower.includes('fail') ||
    lower.includes('invalid') ||
    lower.includes('denied');

  if (failed) {
    return { sent: false, error: text, status, response: text };
  }

  return { sent: true, response: text };
}

async function sendRegistrationSms({ phone, fullName, serialNumber }) {
  console.log('========================================');
  console.log('[DOSNET SMS] Registration SMS — starting');
  console.log('========================================');

  const config = getDosnetConfig();

  if (!isSmsConfigured()) {
    const missing = getMissingDosnetVars();
    console.warn('[DOSNET SMS] Skipped — DOSNET env vars not configured');
    console.warn('[DOSNET SMS] Missing variables:', missing.join(', ') || 'unknown');
    console.warn('[DOSNET SMS] Create Alvas-pragati-backend/.env from .env.example and restart the server');
    return { sent: false, skipped: true, reason: 'not_configured', missing };
  }

  const mobile = normalizeIndianMobile(phone);
  if (!mobile || mobile.length < 12) {
    console.error('[DOSNET SMS] Invalid mobile number:', phone);
    return { sent: false, error: 'invalid_phone' };
  }

  const { var1Name, var2Year, var3RegNumber } = getTemplateVariables(fullName, serialNumber);
  const message = buildRegistrationMessage({ var1Name, var2Year, var3RegNumber });

  console.log('[DOSNET SMS] Template variable mapping:');
  console.log('  Variable 1 {#alphanumeric#} (name):', var1Name);
  console.log('  Variable 2 {#numeric#} (year):', var2Year);
  console.log('  Variable 3 {#numeric#} (registration no):', var3RegNumber);
  console.log('[DOSNET SMS] Recipient mobile:', mobile);

  // Do not block the SMS request on outbound IP detection (can add 10+ seconds).
  getServerPublicIp()
    .then((serverPublicIp) => {
      if (serverPublicIp) {
        console.log('[DOSNET SMS] Server outbound IP (whitelist this in DOSNET):', serverPublicIp);
      } else {
        console.warn(
          '[DOSNET SMS] Server outbound IP: could not detect — set SERVER_PUBLIC_IP in .env or whitelist IP in Azure portal'
        );
      }
    })
    .catch(() => {});

  console.log('[DOSNET SMS] Sender ID:', config.senderId);
  console.log('[DOSNET SMS] Template ID:', config.templateId);
  console.log('[DOSNET SMS] API Key:', config.apiKey);
  console.log('[DOSNET SMS] Built message:', message);

  const baseUrl = config.apiUrl.replace(/\/$/, '');
  const params = new URLSearchParams({
    username: config.username,
    apikey: config.apiKey,
    apirequest: 'Text',
    sender: config.senderId,
    mobile,
    message,
    route: config.route,
    TemplateID: config.templateId,
    format: 'JSON',
  });
  const url = `${baseUrl}?${params.toString()}`;

  console.log('[DOSNET SMS] Calling API...');
  console.log('[DOSNET SMS] Request URL:', url);

  try {
    const startedAt = Date.now();
    const { status, text } = await callDosnetApi(url);
    const elapsed = Date.now() - startedAt;

    console.log('[DOSNET SMS] API response received in', `${elapsed}ms`);
    console.log('[DOSNET SMS] HTTP status:', status);
    console.log('[DOSNET SMS] Response body:', text);

    const result = evaluateDosnetResponse(status, text);

    if (!result.sent) {
      console.error('[DOSNET SMS] Send FAILED:', result.error);
      if (result.ipBlocked) {
        console.error('[DOSNET SMS] Action required: whitelist server IP in DOSNET SMS panel');
      }
      console.log('========================================');
      return result;
    }

    console.log('[DOSNET SMS] Send SUCCESS');
    console.log('========================================');
    return {
      sent: true,
      response: text,
      variables: { var1Name, var2Year, var3RegNumber },
    };
  } catch (err) {
    const cause = err.cause || {};
    console.error('[DOSNET SMS] Request ERROR:', err.message);
    if (cause.code || cause.message) {
      console.error('[DOSNET SMS] Error code:', cause.code || cause.message);
    }
    getServerPublicIp()
      .then((serverPublicIp) => {
        if (serverPublicIp) {
          console.error('[DOSNET SMS] Whitelist this server IP in DOSNET panel:', serverPublicIp);
        }
      })
      .catch(() => {});
    console.error(
      '[DOSNET SMS] Check: server outbound HTTPS to sms.dosnet.in, DNS, firewall, and DOSNET IP whitelist'
    );
    console.log('========================================');
    return {
      sent: false,
      error: err.message,
      code: cause.code || err.code || null,
    };
  }
}

module.exports = {
  sendRegistrationSms,
  getTemplateVariables,
  buildRegistrationMessage,
  normalizeIndianMobile,
  isSmsConfigured,
  getDosnetConfig,
  getMissingDosnetVars,
};
