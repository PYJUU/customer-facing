import { describe, expect, it, vi } from "vitest";
import { createManualScan } from "@/lib/services/scans";

function buildFakeDb({
  site,
  runningScan,
}: {
  site: null | { id: string; status: string };
  runningScan: null | { id: string };
}) {
  const tx = {
    $queryRaw: vi.fn().mockResolvedValue(undefined),
    site: {
      findFirst: vi.fn().mockResolvedValue(site),
    },
    scan: {
      findFirst: vi.fn().mockResolvedValue(runningScan),
      create: vi.fn().mockResolvedValue({ id: "scan_1", status: "queued" }),
    },
    scanJob: {
      create: vi.fn().mockResolvedValue({ id: "job_1" }),
    },
  };

  return {
    tx,
    db: {
      $transaction: vi.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)),
    },
  };
}

describe("createManualScan", () => {
  it("creates scan and scanJob when no running scan", async () => {
    const { db } = buildFakeDb({
      site: { id: "site_1", status: "active" },
      runningScan: null,
    });

    const fakeQueue = {
      enqueue: vi.fn().mockResolvedValue({ queueJobId: "q_1" }),
    };

    const result = await createManualScan(
      "site_1",
      "org_1",
      "req_1",
      db as never,
      fakeQueue as never,
    );

    expect(result.scanId).toBe("scan_1");
    expect(result.status).toBe("queued");
    expect(result.queueJobId).toBe("q_1");
  });

  it("throws SCAN_ALREADY_RUNNING when in-flight scan exists", async () => {
    const { db } = buildFakeDb({
      site: { id: "site_1", status: "active" },
      runningScan: { id: "scan_running" },
    });

    const fakeQueue = {
      enqueue: vi.fn(),
    };

    await expect(
      createManualScan(
        "site_1",
        "org_1",
        "req_1",
        db as never,
        fakeQueue as never,
      ),
    ).rejects.toThrow("SCAN_ALREADY_RUNNING");
  });
});
