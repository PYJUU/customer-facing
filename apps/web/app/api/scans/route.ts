import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getRequestOrganizationId } from "@/lib/request-context";
import { rateLimit } from "@/lib/security/rate-limit";

const scanInput = z.object({
  siteId: z.string().min(1),
});

export async function POST(req: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "服务暂不可用：缺少 DATABASE_URL" },
      { status: 503 },
    );
  }

  try {
    const orgId = await getRequestOrganizationId();
    const limitResult = rateLimit(`scan-trigger:${orgId}`, 10, 60_000);
    if (!limitResult.allowed) {
      return NextResponse.json(
        { error: "触发过于频繁，请稍后再试" },
        { status: 429 },
      );
    }

    const body = await req.json();
    const parsed = scanInput.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "参数不合法" }, { status: 400 });
    }

    const site = await prisma.site.findFirst({
      where: {
        id: parsed.data.siteId,
        organizationId: orgId,
      },
    });

    if (!site) {
      return NextResponse.json(
        { error: "站点不存在或无权限" },
        { status: 404 },
      );
    }

    if (site.status !== "active") {
      return NextResponse.json(
        { error: "站点已停用，无法触发扫描" },
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
      return NextResponse.json(
        { error: "已有进行中的扫描任务" },
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
        logs: "queued by manual api",
      },
    });

    return NextResponse.json(
      { scanId: scan.id, status: scan.status },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: "服务异常" }, { status: 500 });
  }
}
