import assert from "node:assert/strict";
import test from "node:test";
import {
  createTranscriber,
  TranscriptionNotConfiguredError,
  TranscriptionServiceError,
} from "./transcription.js";

const audio = {
  audio: new Uint8Array([1, 2, 3]),
  mimeType: "audio/webm",
  filename: "intake.webm",
  locale: "en-US",
};

test("transcriber sends audio to the configured endpoint and returns its transcript", async () => {
  let receivedAuthorization: string | null = null;
  let receivedModel: FormDataEntryValue | null = null;
  let receivedFileName: string | undefined;
  const transcribe = createTranscriber({
    endpoint: "https://speech.example.test/v1/audio/transcriptions",
    apiKey: "test-key",
    model: "test-model",
    fetcher: async (_input, init) => {
      receivedAuthorization = new Headers(init?.headers).get("authorization");
      const form = init?.body as FormData;
      receivedModel = form.get("model");
      const file = form.get("file");
      receivedFileName = file instanceof File ? file.name : undefined;
      return Response.json({ text: "A private transcript" });
    },
  });

  assert.equal(await transcribe(audio), "A private transcript");
  assert.equal(receivedAuthorization, "Bearer test-key");
  assert.equal(receivedModel, "test-model");
  assert.equal(receivedFileName, "intake.webm");
});

test("transcriber fails explicitly when no provider is configured", async () => {
  const transcribe = createTranscriber({ model: "whisper-1" });

  await assert.rejects(transcribe(audio), TranscriptionNotConfiguredError);
});

test("transcriber rejects an unsuccessful provider response without exposing its body", async () => {
  const transcribe = createTranscriber({
    endpoint: "https://speech.example.test/transcribe",
    model: "test-model",
    fetcher: async () => new Response("sensitive provider response", { status: 500 }),
  });

  await assert.rejects(
    transcribe(audio),
    (error: unknown) => error instanceof TranscriptionServiceError && error.code === "provider_rejected",
  );
});

test("transcriber rejects malformed provider output", async () => {
  const transcribe = createTranscriber({
    endpoint: "https://speech.example.test/transcribe",
    model: "test-model",
    fetcher: async () => Response.json({ text: " " }),
  });

  await assert.rejects(
    transcribe(audio),
    (error: unknown) => error instanceof TranscriptionServiceError && error.code === "invalid_provider_response",
  );
});
