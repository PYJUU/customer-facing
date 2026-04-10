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

    const jobs = await prisma.scanJob.findMany({
      where: {
        scanId,
        scan: {
          site: {
            organizationId: orgId,
          },
        },
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        status: true,
        attempts: true,
        logs: true,
        payload: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return Response.json({ data: jobs, requestId });
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
