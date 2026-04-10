import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { getRequestOrganizationId } from "@/lib/request-context";
import { NoOrganizationError, UnauthenticatedError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

export default async function SiteDetailPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;

  if (!process.env.DATABASE_URL) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">站点详情</h2>
        <Card>未配置 DATABASE_URL，请先完成环境配置。</Card>
      </section>
    );
  }

  try {
    const orgId = await getRequestOrganizationId();
    const site = await prisma.site.findFirst({
      where: {
        id: siteId,
        organizationId: orgId,
      },
      include: { scans: { orderBy: { createdAt: "desc" }, take: 10 } },
    });

    if (!site) {
      notFound();
    }

    return (
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{site.name}</h2>
        <Card>
          <p className="text-sm text-slate-500">概览</p>
          <p>URL: {site.baseUrl}</p>
          <p>状态: {site.status}</p>
        </Card>
        <Card>
          <p className="mb-2 text-sm text-slate-500">扫描历史</p>
          <ul className="space-y-1 text-sm">
            {site.scans.length === 0 ? <li>暂无扫描记录</li> : null}
            {site.scans.map((scan) => (
              <li key={scan.id}>
                {scan.status} · {scan.createdAt.toISOString()}
              </li>
            ))}
          </ul>
        </Card>
        <Card>问题列表（预留）</Card>
        <Card>设置（预留）</Card>
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
