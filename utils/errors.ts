import type { ContentfulStatusCode } from "hono/utils/http-status";

export class HttpError extends Error {
    status: number;
    constructor(status: number, message: string) {
        super(message);
        this.status = status;
        this.name = "HttpError";
    }   
}
type JsonBody = Record<string, unknown>; // safe JSON-ish object

export function toHttpJson(err: unknown): { status: ContentfulStatusCode; body: JsonBody } {
  // Explicit HttpError → pass through status + message
  if (err instanceof HttpError) {
    return {
      status: err.status as ContentfulStatusCode,
      body: { error: "HttpError", message: err.message },
    };
  }

  // Generic Error → 500
  if (err instanceof Error) {
    return {
      status: 500 as ContentfulStatusCode,
      body: { error: "InternalServerError", message: err.message },
    };
  }

  // fallback
  return {
    status: 400 as ContentfulStatusCode,
    body: { error: "BadRequest", message: String(err) },
  };
}
