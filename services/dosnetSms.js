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

function isSmsConfigured() {
  return Boolean(
    process.env.DOSNET_API_URL &&
      process.env.DOSNET_API_KEY &&
      process.env.DOSNET_USERNAME &&
      process.env.DOSNET_SENDERID
  );
}

async function sendRegistrationSms({ phone, fullName, serialNumber }) {
  console.log('========================================');
  console.log('[DOSNET SMS] Registration SMS — starting');
  console.log('========================================');

  if (!isSmsConfigured()) {
    const missing = ['DOSNET_API_URL', 'DOSNET_API_KEY', 'DOSNET_USERNAME', 'DOSNET_SENDERID'].filter(
      (k) => !process.env[k]
    );
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
  console.log('[DOSNET SMS] Sender ID:', process.env.DOSNET_SENDERID);
  console.log('[DOSNET SMS] Template ID:', process.env.DOSNET_TEMPLATE_ID);
  console.log('[DOSNET SMS] Built message:', message);

  const baseUrl = process.env.DOSNET_API_URL.replace(/\/$/, '');
  const params = new URLSearchParams({
    username: process.env.DOSNET_USERNAME,
    apikey: process.env.DOSNET_API_KEY,
    apirequest: "Text",
    sender: process.env.DOSNET_SENDERID,
    mobile,
    message,
    route: process.env.DOSNET_ROUTE || 'TRANS',
     TemplateID: process.env.DOSNET_TEMPLATE_ID || '',
    format: "JSON"
  });
  console.log("process.env.DOSNET_API_KEY",process.env.DOSNET_API_KEY)
  const url = `${baseUrl}?${params.toString()}`;
  const safeLogUrl = url.replace(process.env.DOSNET_API_KEY);

  console.log('[DOSNET SMS] Calling API...');
  console.log('[DOSNET SMS] Request URL:', safeLogUrl);

  try {
    const startedAt = Date.now();
    const res = await fetch(url, { method: 'GET' });
    const text = (await res.text()).trim();
    const elapsed = Date.now() - startedAt;

    console.log('[DOSNET SMS] API response received in', `${elapsed}ms`);
    console.log('[DOSNET SMS] HTTP status:', res.status);
    console.log('[DOSNET SMS] Response body:', text);

    const lower = text.toLowerCase();
    const failed =
      !res.ok ||
      lower.includes('error') ||
      lower.includes('fail') ||
      lower.includes('invalid') ||
      lower.includes('denied');

    if (failed) {
      console.error('[DOSNET SMS] Send FAILED');
      console.log('========================================');
      return { sent: false, error: text, status: res.status };
    }

    console.log('[DOSNET SMS] Send SUCCESS');
    console.log('========================================');
    return {
      sent: true,
      response: text,
      variables: { var1Name, var2Year, var3RegNumber },
    };
  } catch (err) {
    console.error('[DOSNET SMS] Request ERROR:', err.message);
    console.log('========================================');
    return { sent: false, error: err.message };
  }
}

module.exports = {
  sendRegistrationSms,
  getTemplateVariables,
  buildRegistrationMessage,
  normalizeIndianMobile,
  isSmsConfigured,
};
