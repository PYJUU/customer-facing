import { describe, expect, it, vi } from "vitest";
import dns from "node:dns/promises";
import { normalizePublicBaseUrl } from "@/lib/security/url-guard";

describe("normalizePublicBaseUrl", () => {
  it("rejects localhost and private IP targets", async () => {
    await expect(normalizePublicBaseUrl("http://localhost")).rejects.toThrow();
    await expect(
      normalizePublicBaseUrl("http://foo.localhost"),
    ).rejects.toThrow();
    await expect(normalizePublicBaseUrl("http://127.0.0.1")).rejects.toThrow();
  });

  it("normalizes valid public URL", async () => {
    const spy = vi
      .spyOn(dns, "lookup")
      .mockResolvedValue([{ address: "93.184.216.34", family: 4 }] as never);

    await expect(
      normalizePublicBaseUrl("https://example.com/shop/?a=1#hash"),
    ).resolves.toBe("https://example.com/shop");
    spy.mockRestore();
  });

  it("rejects hostname that resolves to private IP", async () => {
    const spy = vi
      .spyOn(dns, "lookup")
      .mockResolvedValue([{ address: "10.0.0.1", family: 4 }] as never);

    await expect(
      normalizePublicBaseUrl("https://public.example.com"),
    ).rejects.toThrow();
    spy.mockRestore();
  });
});
