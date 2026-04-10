"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function NewSitePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [platform, setPlatform] = useState("custom");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          baseUrl: baseUrl.trim(),
          platform,
        }),
      });

      if (!res.ok) {
        const payload = (await res.json()) as { error?: string };
        setError(payload.error ?? "保存失败");
        return;
      }

      router.push("/sites");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="max-w-xl">
      <h2 className="mb-4 text-xl font-semibold">添加站点</h2>
      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="block">
          <span className="mb-1 block text-sm">站点名称</span>
          <input className="w-full rounded-md border p-2" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm">基础 URL</span>
          <input
            className="w-full rounded-md border p-2"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://example.com"
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm">站点类型</span>
          <select className="w-full rounded-md border p-2" value={platform} onChange={(e) => setPlatform(e.target.value)}>
            <option value="shopify">Shopify</option>
            <option value="woocommerce">WooCommerce</option>
            <option value="custom">Custom</option>
          </select>
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button disabled={submitting} type="submit">
          {submitting ? "保存中..." : "保存站点"}
        </Button>
      </form>
    </section>
  );
}
