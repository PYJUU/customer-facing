"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    onTurnstileSolved?: (token: string) => void;
  }
}

export function TurnstileWidget({
  name = "turnstileToken",
}: {
  name?: string;
}) {
  const [token, setToken] = useState("");
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

  useEffect(() => {
    window.onTurnstileSolved = (nextToken: string) => {
      setToken(nextToken);
    };

    return () => {
      window.onTurnstileSolved = undefined;
    };
  }, []);

  if (!siteKey) {
    return null;
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        async
        defer
      />
      <div
        className="cf-turnstile"
        data-sitekey={siteKey}
        data-callback="onTurnstileSolved"
      />
      <input type="hidden" name={name} value={token} readOnly />
    </>
  );
}
