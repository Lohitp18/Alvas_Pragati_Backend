const Candidate = require('../models/Candidate');

/** Parse legacy 26AL000001 or new 000001 format to integer */
function parseSerialToNumber(serial) {
  if (!serial || typeof serial !== 'string') return 0;
  const trimmed = serial.trim();
  if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10);
  const legacy = trimmed.match(/^26AL(\d+)$/i);
  if (legacy) return parseInt(legacy[1], 10);
  const digits = trimmed.replace(/\D/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

/** Next serial: 000001, 000002, ... (6 digits, no prefix) */
async function getNextSerialNumber() {
  const candidates = await Candidate.find({ serialNumber: { $exists: true, $ne: null } })
    .select('serialNumber')
    .lean();

  let maxNum = 0;
  for (const c of candidates) {
    const n = parseSerialToNumber(c.serialNumber);
    if (n > maxNum) maxNum = n;
  }

  return String(maxNum + 1).padStart(6, '0');
}

module.exports = { getNextSerialNumber, parseSerialToNumber };
