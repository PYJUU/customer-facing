import { isIP } from "node:net";

const PRIVATE_IP_RANGES = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^192\.168\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
];

export function normalizePublicBaseUrl(raw: string): string {
  const parsed = new URL(raw);

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("仅支持 http 或 https 协议");
  }

  if (!parsed.hostname) {
    throw new Error("无效域名");
  }

  if (isIP(parsed.hostname)) {
    const isPrivate = PRIVATE_IP_RANGES.some((pattern) => pattern.test(parsed.hostname));
    if (isPrivate) {
      throw new Error("禁止扫描内网 IP");
    }
  }

  parsed.hash = "";
  parsed.search = "";
  parsed.pathname = parsed.pathname === "/" ? "/" : parsed.pathname.replace(/\/$/, "");

  return parsed.toString();
}
