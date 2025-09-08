export class HttpError extends Error {
    status: number;
    constructor(status: number, message: string) {
        super(message);
        this.status = status;
        this.name = "HttpError";
    }   
}
type JsonBody = Record<string, unknown>; // safe JSON-ish object

export function toHttpJson(err: unknown): { status: number; body: JsonBody } {
  // Explicit HttpError → pass through status + message
  if (err instanceof HttpError) {
    return {
      status: err.status,
      body: { error: "HttpError", message: err.message },
    };
  }

  // Generic Error → 500
  if (err instanceof Error) {
    return {
      status: 500,
      body: { error: "InternalServerError", message: err.message },
    };
  }

  // fallback
  return {
    status: 400,
    body: { error: "BadRequest", message: String(err) },
  };
}
