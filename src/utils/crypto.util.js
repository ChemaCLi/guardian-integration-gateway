/**
 * Crypto Utility — Encryption for audit message storage
 *
 * Uses AES-256-CBC for encrypting original messages before storage.
 * Key is loaded from config/environment variable.
 *
 * Note: This is a simple implementation for compliance storage.
 * For production, consider using a dedicated secrets manager.
 */

const crypto = require('crypto');
const config = require('../../config');

/** Encryption algorithm */
const ALGORITHM = 'aes-256-cbc';

/** IV length for AES-CBC */
const IV_LENGTH = 16;

/**
 * Gets the encryption key from config.
 * Key must be 32 bytes (256 bits) for AES-256.
 *
 * @returns {Buffer} 32-byte encryption key
 * @throws {Error} If encryption key is not configured or invalid
 */
function getKey() {
  const keyString = config.encryptionKey;

  if (!keyString) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }

  // Use SHA-256 hash of the key to ensure 32 bytes
  return crypto.createHash('sha256').update(keyString).digest();
}

/**
 * Encrypts text using AES-256-CBC.
 *
 * @param {string} text - Plaintext to encrypt
 * @returns {string} Encrypted text as hex string (iv:ciphertext)
 * @throws {Error} If encryption key is not configured
 */
function encrypt(text) {
  if (typeof text !== 'string') {
    return '';
  }

  if (text === '') {
    return '';
  }

  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Return iv:ciphertext format for decryption
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypts text that was encrypted with encrypt().
 *
 * @param {string} encryptedText - Encrypted text in iv:ciphertext format
 * @returns {string} Decrypted plaintext
 * @throws {Error} If encryption key is not configured or text is invalid
 */
function decrypt(encryptedText) {
  if (typeof encryptedText !== 'string') {
    return '';
  }

  if (encryptedText === '') {
    return '';
  }

  const parts = encryptedText.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted text format');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];

  const key = getKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

module.exports = {
  encrypt,
  decrypt,
};
