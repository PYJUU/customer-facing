import { z } from "zod";
import { getRequestOrganizationId } from "@/lib/request-context";
import { rateLimit } from "@/lib/security/rate-limit";
import { getRequestId, logger } from "@/lib/logger";
import {
  apiError,
  NoOrganizationError,
  UnauthenticatedError,
} from "@/lib/api/errors";
import { createManualScan } from "@/lib/services/scans";

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
    return apiError(
      503,
      "SERVICE_UNAVAILABLE",
      "服务暂不可用：缺少 DATABASE_URL",
      requestId,
    );
  }

  try {
    const orgId = await getRequestOrganizationId();
    const limitResult = rateLimit(`scan-trigger:${orgId}`, 10, 60_000);
    if (!limitResult.allowed) {
      return apiError(
        429,
        "RATE_LIMITED",
        "触发过于频繁，请稍后再试",
        requestId,
        {
          retryAfterMs: limitResult.retryAfterMs,
        },
      );
    }

    const body = await req.json();
    const parsed = scanInput.safeParse(body);

    if (!parsed.success) {
      return apiError(
        400,
        "VALIDATION_ERROR",
        "参数不合法",
        requestId,
        parsed.error.flatten(),
      );
    }

    const result = await createManualScan(parsed.data.siteId, orgId, requestId);
    logger.info({
      event: "scan.create.success",
      requestId,
      orgId,
      siteId: parsed.data.siteId,
      scanId: result.scanId,
    });

    return Response.json({ data: result, requestId }, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return apiError(401, "UNAUTHENTICATED", "未登录", requestId);
    }

    if (error instanceof NoOrganizationError) {
      return apiError(403, "NO_ORGANIZATION", "用户未关联组织", requestId);
    }

    if (error instanceof Error && error.message === "SITE_NOT_FOUND") {
      return apiError(404, "NOT_FOUND", "站点不存在或无权限", requestId);
    }

    if (error instanceof Error && error.message === "SITE_INACTIVE") {
      return apiError(
        400,
        "VALIDATION_ERROR",
        "站点已停用，无法触发扫描",
        requestId,
      );
    }

    if (error instanceof Error && error.message === "SCAN_ALREADY_RUNNING") {
      return apiError(409, "CONFLICT", "已有进行中的扫描任务", requestId);
    }

    logger.error({
      event: "scan.create.failed",
      requestId,
      error: String(error),
    });
    return apiError(500, "INTERNAL_ERROR", "服务异常", requestId);
  }
}
