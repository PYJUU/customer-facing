import { isIP } from "node:net";
import dns from "node:dns/promises";

const PRIVATE_IP_RANGES = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^192\.168\./,
  /^::1$/,
  /^fc00:/i,
  /^fd00:/i,
  /^fe80:/i,
];

function isPrivateIp(ip: string) {
  return PRIVATE_IP_RANGES.some((pattern) => pattern.test(ip));
}

export async function normalizePublicBaseUrl(raw: string): Promise<string> {
  const parsed = new URL(raw);

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("仅支持 http 或 https 协议");
  }

  if (!parsed.hostname) {
    throw new Error("无效域名");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    throw new Error("禁止扫描 localhost 域名");
  }

  if (isIP(hostname) && isPrivateIp(hostname)) {
    throw new Error("禁止扫描内网 IP");
  }

  const resolved = await dns.lookup(hostname, { all: true });
  for (const answer of resolved) {
    if (isPrivateIp(answer.address)) {
      throw new Error("禁止扫描解析到内网地址的域名");
    }
  }

  parsed.hash = "";
  parsed.search = "";
  parsed.pathname =
    parsed.pathname === "/" ? "/" : parsed.pathname.replace(/\/$/, "");

  return parsed.toString();
}

export async function assertSafeRedirectTarget(url: string) {
  await normalizePublicBaseUrl(url);
}
