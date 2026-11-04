import { z } from "zod";

export type TranscriptionOptions = {
  endpoint?: string;
  apiKey?: string;
  model: string;
  fetcher?: typeof fetch;
};

export type AudioInput = {
  audio: Uint8Array;
  mimeType: string;
  filename: string;
  locale: string;
};

export class TranscriptionNotConfiguredError extends Error {
  constructor() {
    super("Speech-to-text provider is not configured");
    this.name = "TranscriptionNotConfiguredError";
  }
}

export class TranscriptionServiceError extends Error {
  constructor(readonly code: "provider_unavailable" | "provider_rejected" | "invalid_provider_response") {
    super(code);
    this.name = "TranscriptionServiceError";
  }
}

const providerResponseSchema = z.object({ text: z.string().trim().min(1).max(12000) });

export function createTranscriber(options: TranscriptionOptions) {
  return async (input: AudioInput): Promise<string> => {
    if (!options.endpoint) {
      throw new TranscriptionNotConfiguredError();
    }

    const form = new FormData();
    form.set("file", new Blob([new Uint8Array(input.audio)], { type: input.mimeType }), input.filename);
    form.set("model", options.model);
    form.set("language", input.locale.split("-")[0] ?? input.locale);

    const headers = new Headers();
    if (options.apiKey) {
      headers.set("authorization", `Bearer ${options.apiKey}`);
    }

    let response: Response;
    try {
      response = await (options.fetcher ?? fetch)(options.endpoint, {
        method: "POST",
        headers,
        body: form,
        signal: AbortSignal.timeout(45_000),
      });
    } catch {
      throw new TranscriptionServiceError("provider_unavailable");
    }

    if (!response.ok) {
      throw new TranscriptionServiceError("provider_rejected");
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new TranscriptionServiceError("invalid_provider_response");
    }

    const parsed = providerResponseSchema.safeParse(payload);
    if (!parsed.success) {
      throw new TranscriptionServiceError("invalid_provider_response");
    }
    return parsed.data.text;
  };
}
