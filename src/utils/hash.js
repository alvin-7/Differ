/**
 * Fast FNV-1a hash implementation for row comparison
 * Replaces JSON.stringify for better performance
 */

// FNV-1a constants
const FNV_PRIME = 0x01000193;
const FNV_OFFSET = 0x811c9dc5;

function hashString(str) {
  let hash = FNV_OFFSET;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }
  return hash >>> 0; // Convert to unsigned 32-bit
}

/**
 * Converts a row object to a deterministic string representation
 * for comparison purposes. Faster than JSON.stringify.
 *
 * @param {any} obj - The row object to hash
 * @returns {string} - A deterministic string representation
 */
function hashRowToString(obj) {
  if (obj === null) return 'null';
  if (obj === undefined) return 'undefined';
  if (typeof obj !== 'object') return String(obj);

  // Sort keys for deterministic ordering
  const keys = Object.keys(obj).sort();
  const parts = [];

  for (const key of keys) {
    const value = obj[key];
    parts.push(`${key}:${hashRowToString(value)}`);
  }

  return parts.join('|');
}

module.exports = { hashRowToString };
