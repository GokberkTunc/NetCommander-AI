import * as crypto from 'crypto';

/**
 * AES-256-GCM Military-grade Cryptographic Vault
 * Used for encrypting passwords, SSH private keys, and AI API tokens.
 */
export class CryptoVault {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32;
  private static readonly IV_LENGTH = 12;
  private static readonly SALT_LENGTH = 16;
  private static readonly ITERATIONS = 100000;
  private static readonly DIGEST = 'sha256';

  // Default fallback machine key if user hasn't set a custom master password
  private static fallbackSecret: string = 'netcommander-default-device-vault-key-2026';

  public static setMasterPassword(password: string): void {
    if (password && password.trim().length > 0) {
      this.fallbackSecret = password.trim();
    }
  }

  /**
   * Derive a 256-bit key from passphrase and salt using PBKDF2
   */
  private static deriveKey(passphrase: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(
      passphrase,
      salt,
      this.ITERATIONS,
      this.KEY_LENGTH,
      this.DIGEST
    );
  }

  /**
   * Encrypt plain text using AES-256-GCM
   * Output format: base64(salt:iv:authTag:ciphertext)
   */
  public static encrypt(plainText: string, masterKey?: string): string {
    if (!plainText) return '';

    const secret = masterKey || this.fallbackSecret;
    const salt = crypto.randomBytes(this.SALT_LENGTH);
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const key = this.deriveKey(secret, salt);

    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plainText, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    const payload = `${salt.toString('base64')}:${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
    return Buffer.from(payload).toString('base64');
  }

  /**
   * Decrypt ciphertext using AES-256-GCM
   */
  public static decrypt(cipherPayload: string, masterKey?: string): string {
    if (!cipherPayload) return '';

    try {
      const decodedPayload = Buffer.from(cipherPayload, 'base64').toString('utf8');
      const parts = decodedPayload.split(':');
      if (parts.length !== 4) {
        // If not formatted as encrypted string, return as-is (e.g. legacy plain text)
        return cipherPayload;
      }

      const salt = Buffer.from(parts[0], 'base64');
      const iv = Buffer.from(parts[1], 'base64');
      const authTag = Buffer.from(parts[2], 'base64');
      const encryptedData = Buffer.from(parts[3], 'base64');

      const secret = masterKey || this.fallbackSecret;
      const key = this.deriveKey(secret, salt);

      const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([
        decipher.update(encryptedData),
        decipher.final(),
      ]);

      return decrypted.toString('utf8');
    } catch (err) {
      console.error('Decryption failed, possibly incorrect master password:', err);
      return '';
    }
  }

  public static hashPassword(password: string, salt: string): string {
    return crypto
      .pbkdf2Sync(password, salt, this.ITERATIONS, 32, this.DIGEST)
      .toString('hex');
  }

  public static generateSalt(): string {
    return crypto.randomBytes(16).toString('hex');
  }
}
