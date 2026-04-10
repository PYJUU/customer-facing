import { SiteStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getRequestOrganizationId } from "@/lib/request-context";
import {
  apiError,
  NoOrganizationError,
  UnauthenticatedError,
} from "@/lib/api/errors";
import { getRequestId } from "@/lib/logger";

const input = z.object({
  status: z.nativeEnum(SiteStatus),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ siteId: string }> },
) {
  const requestId = getRequestId(req);

  try {
    const { siteId } = await params;
    const orgId = await getRequestOrganizationId();
    const body = await req.json();
    const parsed = input.safeParse(body);

    if (!parsed.success) {
      return apiError(
        400,
        "VALIDATION_ERROR",
        "参数不合法",
        requestId,
        parsed.error.flatten(),
      );
    }

    const site = await prisma.site.updateMany({
      where: {
        id: siteId,
        organizationId: orgId,
      },
      data: {
        status: parsed.data.status,
      },
    });

    if (site.count === 0) {
      return apiError(404, "NOT_FOUND", "站点不存在或无权限", requestId);
    }

    return Response.json({
      data: { siteId, status: parsed.data.status },
      requestId,
    });
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return apiError(401, "UNAUTHENTICATED", "未登录", requestId);
    }

    if (error instanceof NoOrganizationError) {
      return apiError(403, "NO_ORGANIZATION", "用户未关联组织", requestId);
    }

    return apiError(
      500,
      "INTERNAL_ERROR",
      "服务异常",
      requestId,
      String(error),
    );
  }
}
