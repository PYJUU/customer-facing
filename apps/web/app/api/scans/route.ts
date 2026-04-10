import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getRequestOrganizationId } from "@/lib/request-context";
import { rateLimit } from "@/lib/security/rate-limit";
import { getRequestId, logger } from "@/lib/logger";

const scanInput = z.object({
  siteId: z.string().min(1),
});

export async function POST(req: Request) {
  const requestId = getRequestId(req);

  if (!process.env.DATABASE_URL) {
    logger.error({
      event: "scan.create.failed",
      requestId,
      error: "missing DATABASE_URL",
    });
    return NextResponse.json(
      { error: "服务暂不可用：缺少 DATABASE_URL", requestId },
      { status: 503 },
    );
  }

  try {
    const orgId = await getRequestOrganizationId();
    const limitResult = rateLimit(`scan-trigger:${orgId}`, 10, 60_000);
    if (!limitResult.allowed) {
      logger.warn({ event: "scan.create.rate_limited", requestId, orgId });
      return NextResponse.json(
        { error: "触发过于频繁，请稍后再试", requestId },
        { status: 429 },
      );
    }

    const body = await req.json();
    const parsed = scanInput.safeParse(body);

    if (!parsed.success) {
      logger.warn({ event: "scan.create.invalid_input", requestId, orgId });
      return NextResponse.json(
        { error: "参数不合法", requestId },
        { status: 400 },
      );
    }

    const site = await prisma.site.findFirst({
      where: {
        id: parsed.data.siteId,
        organizationId: orgId,
      },
    });

    if (!site) {
      logger.warn({
        event: "scan.create.site_not_found",
        requestId,
        orgId,
        siteId: parsed.data.siteId,
      });
      return NextResponse.json(
        { error: "站点不存在或无权限", requestId },
        { status: 404 },
      );
    }

    if (site.status !== "active") {
      logger.warn({
        event: "scan.create.site_inactive",
        requestId,
        orgId,
        siteId: site.id,
      });
      return NextResponse.json(
        { error: "站点已停用，无法触发扫描", requestId },
        { status: 400 },
      );
    }

    const runningScan = await prisma.scan.findFirst({
      where: {
        siteId: site.id,
        status: { in: ["queued", "running"] },
      },
    });

    if (runningScan) {
      logger.warn({
        event: "scan.create.already_running",
        requestId,
        orgId,
        siteId: site.id,
      });
      return NextResponse.json(
        { error: "已有进行中的扫描任务", requestId },
        { status: 409 },
      );
    }

    const scan = await prisma.scan.create({
      data: {
        siteId: parsed.data.siteId,
        status: "queued",
      },
    });

    await prisma.scanJob.create({
      data: {
        scanId: scan.id,
        status: "queued",
        attempts: 0,
        logs: `queued by manual api request_id=${requestId}`,
      },
    });

    logger.info({
      event: "scan.create.success",
      requestId,
      orgId,
      siteId: site.id,
    });
    return NextResponse.json(
      { scanId: scan.id, status: scan.status, requestId },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "服务异常";
    if (message === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "未登录", requestId }, { status: 401 });
    }
    if (message === "NO_ORGANIZATION") {
      return NextResponse.json(
        { error: "用户未关联组织", requestId },
        { status: 403 },
      );
    }

    logger.error({ event: "scan.create.failed", requestId, error: message });
    return NextResponse.json({ error: "服务异常", requestId }, { status: 500 });
  }
}
