const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstileToken(token: string, remoteIp?: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return {
      ok: process.env.NODE_ENV !== "production",
      reason: "missing_secret",
    };
  }

  if (!token) {
    return { ok: false, reason: "missing_token" };
  }

  const formData = new URLSearchParams({
    secret,
    response: token,
  });

  if (remoteIp) {
    formData.set("remoteip", remoteIp);
  }

  const resp = await fetch(TURNSTILE_VERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData,
    cache: "no-store",
  });

  if (!resp.ok) {
    return { ok: false, reason: `http_${resp.status}` };
  }

  const payload = (await resp.json()) as {
    success?: boolean;
    "error-codes"?: string[];
  };
  return {
    ok: Boolean(payload.success),
    reason:
      payload["error-codes"]?.join(",") ??
      (payload.success ? "ok" : "verify_failed"),
  };
}
