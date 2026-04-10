import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { getRequestOrganizationId } from "@/lib/request-context";
import { NoOrganizationError, UnauthenticatedError } from "@/lib/api/errors";
import { SiteActions } from "@/components/sites/site-actions";

export const dynamic = "force-dynamic";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

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

    const jobs = await prisma.scanJob.findMany({
      where: {
        scanId: { in: site.scans.map((scan) => scan.id) },
        scan: { site: { organizationId: orgId } },
      },
      orderBy: { createdAt: "desc" },
    });

    const jobsByScanId = new Map<string, typeof jobs>();
    for (const job of jobs) {
      const current = jobsByScanId.get(job.scanId) ?? [];
      current.push(job);
      jobsByScanId.set(job.scanId, current);
    }

    return (
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{site.name}</h2>
        <Card>
          <p className="text-sm text-slate-500">概览</p>
          <p>URL: {site.baseUrl}</p>
          <p>状态: {site.status}</p>
          <div className="mt-3">
            <SiteActions siteId={site.id} initialStatus={site.status} />
          </div>
        </Card>
        <Card>
          <p className="mb-2 text-sm text-slate-500">扫描历史</p>
          <ul className="space-y-3 text-sm">
            {site.scans.length === 0 ? <li>暂无扫描记录</li> : null}
            {site.scans.map((scan) => {
              const scanJobs = jobsByScanId.get(scan.id) ?? [];
              return (
                <li
                  key={scan.id}
                  className="rounded border border-slate-100 p-3"
                >
                  <p>
                    {scan.status} · {formatDate(scan.createdAt)}
                  </p>
                  {scanJobs.length === 0 ? (
                    <p className="mt-1 text-xs text-slate-500">暂无任务日志</p>
                  ) : (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-blue-600">
                        查看日志（{scanJobs.length}）
                      </summary>
                      <div className="mt-2 space-y-2">
                        {scanJobs.map((job) => (
                          <div
                            key={job.id}
                            className="rounded bg-slate-50 p-2 text-xs"
                          >
                            <p>
                              {job.status} · 第 {job.attempts + 1} 次尝试 ·
                              创建于 {formatDate(job.createdAt)}
                            </p>
                            <p className="mt-1 whitespace-pre-wrap text-slate-600">
                              {job.logs ?? "(无日志内容)"}
                            </p>
                            <pre className="mt-1 overflow-auto rounded bg-white p-2 text-[11px] text-slate-600">
                              {JSON.stringify(job.payload ?? {}, null, 2)}
                            </pre>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </li>
              );
            })}
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
