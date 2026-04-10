import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { SCAN_STATUS, SITE_STATUS } from "@/lib/services/constants";

export type CreateManualScanResult = {
  scanId: string;
  status: string;
};

export async function createManualScan(
  siteId: string,
  orgId: string,
  requestId: string,
): Promise<CreateManualScanResult> {
  return prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${siteId}))`;

      const site = await tx.site.findFirst({
        where: {
          id: siteId,
          organizationId: orgId,
        },
      });

      if (!site) {
        throw new Error("SITE_NOT_FOUND");
      }

      if (site.status !== SITE_STATUS.ACTIVE) {
        throw new Error("SITE_INACTIVE");
      }

      const runningScan = await tx.scan.findFirst({
        where: {
          siteId: site.id,
          status: { in: [SCAN_STATUS.QUEUED, SCAN_STATUS.RUNNING] },
        },
      });

      if (runningScan) {
        throw new Error("SCAN_ALREADY_RUNNING");
      }

      const scan = await tx.scan.create({
        data: {
          siteId,
          status: SCAN_STATUS.QUEUED,
        },
      });

      await tx.scanJob.create({
        data: {
          scanId: scan.id,
          status: SCAN_STATUS.QUEUED,
          attempts: 0,
          logs: `queued by manual api request_id=${requestId}`,
        },
      });

      return {
        scanId: scan.id,
        status: scan.status,
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}
