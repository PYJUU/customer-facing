import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getRequestOrganizationId } from "@/lib/request-context";
import { rateLimit } from "@/lib/security/rate-limit";
import { normalizePublicBaseUrl } from "@/lib/security/url-guard";
import { getRequestId, logger } from "@/lib/logger";
import { verifyTurnstileToken } from "@/lib/security/turnstile";
import {
  apiError,
  NoOrganizationError,
  UnauthenticatedError,
} from "@/lib/api/errors";

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
    return apiError(
      503,
      "SERVICE_UNAVAILABLE",
      "服务暂不可用：缺少 DATABASE_URL",
      requestId,
    );
  }

  try {
    const orgId = await getRequestOrganizationId();
    const limitResult = rateLimit(`site-create:${orgId}`, 20, 60_000);
    if (!limitResult.allowed) {
      logger.warn({ event: "site.create.rate_limited", requestId, orgId });
      return apiError(
        429,
        "RATE_LIMITED",
        "请求过于频繁，请稍后重试",
        requestId,
        {
          retryAfterMs: limitResult.retryAfterMs,
        },
      );
    }

    const body = await req.json();
    const parsed = siteInput.safeParse(body);

    if (!parsed.success) {
      logger.warn({ event: "site.create.invalid_input", requestId, orgId });
      return apiError(
        400,
        "VALIDATION_ERROR",
        "参数不合法",
        requestId,
        parsed.error.flatten(),
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
      return apiError(403, "FORBIDDEN", "人机验证失败", requestId);
    }

    const baseUrl = await normalizePublicBaseUrl(parsed.data.baseUrl);
    const site = await prisma.site.create({
      data: {
        name: parsed.data.name,
        baseUrl,
        platform: parsed.data.platform,
        organizationId: orgId,
      },
    });

    logger.info({
      event: "site.create.success",
      requestId,
      orgId,
      siteId: site.id,
    });
    return Response.json({ data: site, requestId }, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return apiError(401, "UNAUTHENTICATED", "未登录", requestId);
    }

    if (error instanceof NoOrganizationError) {
      return apiError(403, "NO_ORGANIZATION", "用户未关联组织", requestId);
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return apiError(409, "CONFLICT", "该站点已存在", requestId);
    }

    logger.error({
      event: "site.create.failed",
      requestId,
      error: String(error),
    });
    return apiError(500, "INTERNAL_ERROR", "服务异常", requestId);
  }
}
