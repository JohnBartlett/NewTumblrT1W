/**
 * Encryption Utilities
 * For encrypting sensitive data like OAuth tokens
 */

import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16;  // 128 bits
const TAG_LENGTH = 16;  // 128 bits
const SALT_LENGTH = 64;

/**
 * Derive encryption key from password/secret
 */
function deriveKey(secret: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(secret, salt, 100000, KEY_LENGTH, 'sha512');
}

/**
 * Get encryption secret from environment
 */
function getEncryptionSecret(): string {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error('ENCRYPTION_SECRET environment variable is not set');
  }
  if (secret.length < 32) {
    throw new Error('ENCRYPTION_SECRET must be at least 32 characters');
  }
  return secret;
}

/**
 * Encrypt a string
 * @param plaintext - The text to encrypt
 * @returns Encrypted string in format: salt:iv:tag:ciphertext (all hex encoded)
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return plaintext;

  try {
    const secret = getEncryptionSecret();
    
    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Derive key from secret and salt
    const key = deriveKey(secret, salt);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get authentication tag
    const tag = cipher.getAuthTag();
    
    // Combine salt, IV, tag, and encrypted data
    // Format: salt:iv:tag:ciphertext
    return [
      salt.toString('hex'),
      iv.toString('hex'),
      tag.toString('hex'),
      encrypted
    ].join(':');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt a string
 * @param encryptedData - The encrypted string in format: salt:iv:tag:ciphertext
 * @returns Decrypted plaintext
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) return encryptedData;

  try {
    const secret = getEncryptionSecret();
    
    // Split the encrypted data
    const parts = encryptedData.split(':');
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted data format');
    }
    
    const [saltHex, ivHex, tagHex, encrypted] = parts;
    
    // Convert from hex
    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    
    // Derive key from secret and salt
    const key = deriveKey(secret, salt);
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    // Decrypt
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Encrypt OAuth tokens before storing in database
 */
export function encryptOAuthTokens(token: string | null, tokenSecret: string | null): {
  encryptedToken: string | null;
  encryptedTokenSecret: string | null;
} {
  return {
    encryptedToken: token ? encrypt(token) : null,
    encryptedTokenSecret: tokenSecret ? encrypt(tokenSecret) : null,
  };
}

/**
 * Decrypt OAuth tokens after retrieving from database
 */
export function decryptOAuthTokens(encryptedToken: string | null, encryptedTokenSecret: string | null): {
  token: string | null;
  tokenSecret: string | null;
} {
  return {
    token: encryptedToken ? decrypt(encryptedToken) : null,
    tokenSecret: encryptedTokenSecret ? decrypt(encryptedTokenSecret) : null,
  };
}

/**
 * Hash a string using SHA-256 (for non-sensitive one-way hashing)
 */
export function hash(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Compare two strings in constant time (prevents timing attacks)
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  return crypto.timingSafeEqual(
    Buffer.from(a, 'utf8'),
    Buffer.from(b, 'utf8')
  );
}






