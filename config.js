/**
 * Application configuration loaded from environment variables.
 * Single source of truth for server and feature settings.
 */

/**
 * Resolves the HTTP server port from env (default 3000).
 *
 * @returns {number} Port number for the Express server
 */
function getPort() {
  const raw = process.env.PORT;
  if (raw == null || raw === '') return 3000;
  const num = Number(raw);
  return Number.isFinite(num) && num > 0 ? num : 3000;
}

/**
 * Resolves the Node environment (e.g. development, production).
 *
 * @returns {string} NODE_ENV value or 'development'
 */
function getNodeEnv() {
  return process.env.NODE_ENV != null && process.env.NODE_ENV !== ''
    ? process.env.NODE_ENV
    : 'development';
}

/**
 * Resolves the encryption key for storing original messages (optional).
 *
 * @returns {string|undefined} ENCRYPTION_KEY value or undefined
 */
function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY;
  return key != null && key !== '' ? key : undefined;
}

/** Config object: all env-derived settings in one place */
const config = {
  port: getPort(),
  nodeEnv: getNodeEnv(),
  encryptionKey: getEncryptionKey(),
};

module.exports = config;
