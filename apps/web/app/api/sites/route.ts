import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getRequestOrganizationId } from "@/lib/request-context";
import { rateLimit } from "@/lib/security/rate-limit";
import { normalizePublicBaseUrl } from "@/lib/security/url-guard";
import { getRequestId, logger } from "@/lib/logger";
import { verifyTurnstileToken } from "@/lib/security/turnstile";

const siteInput = z.object({
  name: z.string().min(1).max(100),
  baseUrl: z.string().min(1),
  platform: z.enum(["shopify", "woocommerce", "custom"]).default("custom"),
  turnstileToken: z.string().optional(),
});

export async function POST(req: Request) {
  const requestId = getRequestId(req);

  if (!process.env.DATABASE_URL) {
    logger.error({
      event: "site.create.failed",
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
    const limitResult = rateLimit(`site-create:${orgId}`, 20, 60_000);
    if (!limitResult.allowed) {
      logger.warn({ event: "site.create.rate_limited", requestId, orgId });
      return NextResponse.json(
        { error: "请求过于频繁，请稍后重试", requestId },
        { status: 429 },
      );
    }

    const body = await req.json();
    const parsed = siteInput.safeParse(body);

    if (!parsed.success) {
      logger.warn({ event: "site.create.invalid_input", requestId, orgId });
      return NextResponse.json(
        { error: "参数不合法", issues: parsed.error.flatten(), requestId },
        { status: 400 },
      );
    }

    const turnstile = await verifyTurnstileToken(
      parsed.data.turnstileToken ?? "",
    );
    if (!turnstile.ok) {
      logger.warn({
        event: "site.create.turnstile_failed",
        requestId,
        orgId,
        reason: turnstile.reason,
      });
      return NextResponse.json(
        { error: "人机验证失败", requestId },
        { status: 403 },
      );
    }

    const baseUrl = normalizePublicBaseUrl(parsed.data.baseUrl);
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
    });
    if (!organization) {
      logger.warn({ event: "site.create.org_not_found", requestId, orgId });
      return NextResponse.json(
        { error: "组织不存在", requestId },
        { status: 400 },
      );
    }

    const existed = await prisma.site.findFirst({
      where: {
        organizationId: organization.id,
        baseUrl,
      },
    });

    if (existed) {
      logger.warn({ event: "site.create.conflict", requestId, orgId, baseUrl });
      return NextResponse.json(
        { error: "该站点已存在", requestId },
        { status: 409 },
      );
    }

    const site = await prisma.site.create({
      data: {
        name: parsed.data.name,
        baseUrl,
        platform: parsed.data.platform,
        organizationId: organization.id,
      },
    });

    logger.info({
      event: "site.create.success",
      requestId,
      orgId,
      siteId: site.id,
    });
    return NextResponse.json({ ...site, requestId }, { status: 201 });
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

    logger.error({ event: "site.create.failed", requestId, error: message });
    return NextResponse.json({ error: "服务异常", requestId }, { status: 400 });
  }
}
