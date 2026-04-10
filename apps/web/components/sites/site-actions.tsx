"use client";

import { useState } from "react";

type Props = {
  siteId: string;
  initialStatus: "active" | "paused";
};

export function SiteActions({ siteId, initialStatus }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [scanState, setScanState] = useState<
    "idle" | "queued" | "running" | "completed" | "failed"
  >("idle");
  const [message, setMessage] = useState<string>("");

  async function toggleStatus() {
    const target = status === "active" ? "paused" : "active";
    const res = await fetch(`/api/sites/${siteId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: target }),
    });

    if (!res.ok) {
      setMessage("状态更新失败");
      return;
    }

    setStatus(target);
    setMessage(`站点已${target === "active" ? "启用" : "停用"}`);
  }

  async function triggerScan() {
    setMessage("");
    const res = await fetch("/api/scans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteId }),
    });

    const payload = (await res.json()) as {
      data?: { scanId: string; status: string };
      error?: string;
    };

    if (!res.ok || !payload.data) {
      setMessage(payload.error ?? "触发扫描失败");
      return;
    }

    setScanState(payload.data.status as never);

    const timer = setInterval(async () => {
      const statusRes = await fetch(`/api/scans/${payload.data!.scanId}`);
      const statusPayload = (await statusRes.json()) as {
        data?: { status: typeof scanState };
      };
      const current = statusPayload.data?.status;
      if (!current) return;

      setScanState(current);
      if (current === "completed" || current === "failed") {
        clearInterval(timer);
      }
    }, 2000);
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          className="rounded-md border px-3 py-1 text-sm"
          onClick={toggleStatus}
          type="button"
        >
          {status === "active" ? "停用站点" : "启用站点"}
        </button>
        <button
          className="rounded-md bg-slate-900 px-3 py-1 text-sm text-white disabled:opacity-60"
          onClick={triggerScan}
          type="button"
          disabled={status !== "active"}
        >
          立即扫描
        </button>
      </div>
      <p className="text-sm text-slate-500">当前站点状态：{status}</p>
      <p className="text-sm text-slate-500">扫描状态：{scanState}</p>
      {message ? <p className="text-sm text-blue-600">{message}</p> : null}
    </div>
  );
}
