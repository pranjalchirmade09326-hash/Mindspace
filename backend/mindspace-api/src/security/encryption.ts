import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const IV_LENGTH = 12;
const TAG_LENGTH = 16;

export function createContentCipher(keys: ReadonlyMap<string, Buffer>, currentVersion: string) {
  const currentKey = keys.get(currentVersion);
  if (!currentKey) {
    throw new Error(`Missing encryption key version ${currentVersion}`);
  }

  return {
    encrypt(plaintext: string) {
      const iv = randomBytes(IV_LENGTH);
      const cipher = createCipheriv("aes-256-gcm", currentKey, iv);
      const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
      return {
        ciphertext: Buffer.concat([iv, cipher.getAuthTag(), encrypted]),
        keyVersion: currentVersion,
      };
    },
    decrypt(ciphertext: Uint8Array, keyVersion: string) {
      const key = keys.get(keyVersion);
      if (!key) {
        throw new Error(`Encryption key version ${keyVersion} is unavailable`);
      }

      const packed = Buffer.from(ciphertext);
      if (packed.length <= IV_LENGTH + TAG_LENGTH) {
        throw new Error("Stored intake content has an invalid ciphertext format");
      }

      const iv = packed.subarray(0, IV_LENGTH);
      const tag = packed.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
      const encrypted = packed.subarray(IV_LENGTH + TAG_LENGTH);
      const decipher = createDecipheriv("aes-256-gcm", key, iv);
      decipher.setAuthTag(tag);
      return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
    },
  };
}
