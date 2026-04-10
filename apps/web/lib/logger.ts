import crypto from "node:crypto";

type LogLevel = "info" | "warn" | "error";

type LogPayload = {
  event: string;
  requestId?: string;
  orgId?: string;
  siteId?: string;
  error?: string;
  [key: string]: unknown;
};

function write(level: LogLevel, payload: LogPayload) {
  const body = {
    level,
    ts: new Date().toISOString(),
    ...payload,
  };
  const line = JSON.stringify(body);

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
}

export const logger = {
  info: (payload: LogPayload) => write("info", payload),
  warn: (payload: LogPayload) => write("warn", payload),
  error: (payload: LogPayload) => write("error", payload),
};

export function getRequestId(req: Request) {
  return req.headers.get("x-request-id") ?? crypto.randomUUID();
}
