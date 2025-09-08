import type { Context } from "hono";

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
  if (err instanceof Error) {
    return {
      status: 500,
      body: { message: err.message },
    };
  }

  // fallback
  return {
    status: 400,
    body: { message: String(err) },
  };
}