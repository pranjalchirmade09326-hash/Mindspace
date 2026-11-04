import assert from "node:assert/strict";
import test from "node:test";
import { createContentCipher } from "./encryption.js";

test("intake content encrypts and decrypts with its key version", () => {
  const key = Buffer.alloc(32, 7);
  const cipher = createContentCipher(new Map([["v1", key]]), "v1");
  const encrypted = cipher.encrypt("A private reflection");

  assert.notEqual(encrypted.ciphertext.toString("utf8"), "A private reflection");
  assert.equal(cipher.decrypt(encrypted.ciphertext, encrypted.keyVersion), "A private reflection");
});

test("ciphertext cannot be decrypted after tampering", () => {
  const key = Buffer.alloc(32, 7);
  const cipher = createContentCipher(new Map([["v1", key]]), "v1");
  const encrypted = cipher.encrypt("A private reflection");
  const lastByteIndex = encrypted.ciphertext.length - 1;
  const lastByte = encrypted.ciphertext.at(lastByteIndex);
  assert.ok(lastByte !== undefined);
  encrypted.ciphertext.set([lastByte ^ 1], lastByteIndex);

  assert.throws(() => cipher.decrypt(encrypted.ciphertext, "v1"));
});

test("decrypt rejects an unavailable historical key", () => {
  const cipher = createContentCipher(new Map([["v2", Buffer.alloc(32, 9)]]), "v2");

  assert.throws(() => cipher.decrypt(Buffer.alloc(32), "v1"), /unavailable/);
});
