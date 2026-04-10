import crypto from "node:crypto";
import { logger } from "@/lib/logger";
import type { ScanJobPayload } from "@/lib/services/scan-jobs";

export type EnqueueResult = {
  queueJobId: string;
};

export interface ScanQueue {
  enqueue(payload: ScanJobPayload): Promise<EnqueueResult>;
}

class LocalInMemoryScanQueue implements ScanQueue {
  async enqueue(payload: ScanJobPayload): Promise<EnqueueResult> {
    const queueJobId = crypto.randomUUID();
    logger.info({
      event: "scan.queue.enqueued",
      scanId: payload.scanId,
      siteId: payload.siteId,
      orgId: payload.organizationId,
      queueJobId,
    });

    return { queueJobId };
  }
}

let queue: ScanQueue | null = null;

export function getScanQueue(): ScanQueue {
  if (!queue) {
    queue = new LocalInMemoryScanQueue();
  }

  return queue;
}
