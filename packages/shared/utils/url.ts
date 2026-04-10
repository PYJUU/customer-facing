export function normalizeUrl(input: string): string {
  const url = new URL(input);
  url.hash = "";
  if (url.pathname.endsWith("/")) {
    url.pathname = url.pathname.slice(0, -1);
  }
  return url.toString();
}

export function isInternalUrl(baseUrl: string, candidate: string): boolean {
  const base = new URL(baseUrl);
  const target = new URL(candidate, baseUrl);
  return base.hostname === target.hostname;
}
