import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getRequestOrganizationId } from "@/lib/request-context";
import { NoOrganizationError, UnauthenticatedError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

export default async function SitesPage() {
  if (!process.env.DATABASE_URL) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">站点列表</h2>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          未配置 DATABASE_URL，请先完成环境配置。
        </div>
      </section>
    );
  }

  try {
    const orgId = await getRequestOrganizationId();
    const sites = await prisma.site.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">站点列表</h2>
          <Link className="text-sm text-blue-600" href="/sites/new">
            + 添加站点
          </Link>
        </div>
        {sites.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            暂无站点，请先添加一个站点。
          </div>
        ) : (
          <div className="space-y-2">
            {sites.map((site) => (
              <div
                key={site.id}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              >
                <Link
                  href={`/sites/${site.id}`}
                  className="font-medium text-slate-900"
                >
                  {site.name}
                </Link>
                <p className="text-sm text-slate-500">{site.baseUrl}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return (
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="mb-3">你尚未登录。</p>
          <Link href="/login" className="text-blue-600">
            去登录
          </Link>
        </section>
      );
    }

    if (error instanceof NoOrganizationError) {
      return (
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="mb-3">你当前还没有可用组织。</p>
          <p className="text-sm text-slate-500">
            请联系管理员邀请你加入组织，或先完成组织初始化流程。
          </p>
        </section>
      );
    }

    throw error;
  }
}
