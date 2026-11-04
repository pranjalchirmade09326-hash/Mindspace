import { config } from "../config.js";
import { createContentCipher } from "./encryption.js";

export const intakeContentCipher = createContentCipher(
  config.encryptionKeys,
  config.currentEncryptionKeyVersion,
);
