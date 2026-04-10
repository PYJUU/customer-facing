import { ScanStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ScanJobPayload = {
  scanId: string;
  siteId: string;
  organizationId: string;
  triggeredBy: "manual" | "schedule";
  requestedAt: string;
};

export async function markScanRunning(scanId: string) {
  await prisma.scan.update({
    where: { id: scanId },
    data: {
      status: ScanStatus.running,
      startedAt: new Date(),
    },
  });
}

export async function markScanCompleted(scanId: string) {
  await prisma.scan.update({
    where: { id: scanId },
    data: {
      status: ScanStatus.completed,
      completedAt: new Date(),
    },
  });
}

export async function markScanFailed(scanId: string, reason: string) {
  await prisma.scan.update({
    where: { id: scanId },
    data: {
      status: ScanStatus.failed,
      completedAt: new Date(),
    },
  });

  await prisma.scanJob.updateMany({
    where: { scanId },
    data: {
      status: ScanStatus.failed,
      logs: reason,
    },
  });
}
