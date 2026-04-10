import { prisma } from "@/lib/prisma";
import { getRequestOrganizationId } from "@/lib/request-context";
import {
  apiError,
  NoOrganizationError,
  UnauthenticatedError,
} from "@/lib/api/errors";
import { getRequestId } from "@/lib/logger";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ scanId: string }> },
) {
  const requestId = getRequestId(req);

  try {
    const { scanId } = await params;
    const orgId = await getRequestOrganizationId();

    const scan = await prisma.scan.findFirst({
      where: {
        id: scanId,
        site: {
          organizationId: orgId,
        },
      },
      select: {
        id: true,
        status: true,
        startedAt: true,
        completedAt: true,
      },
    });

    if (!scan) {
      return apiError(404, "NOT_FOUND", "扫描不存在或无权限", requestId);
    }

    return Response.json({ data: scan, requestId });
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
