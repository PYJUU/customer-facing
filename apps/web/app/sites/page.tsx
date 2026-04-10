import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DEFAULT_ORG_ID = process.env.DEFAULT_ORG_ID ?? "default-org";

export default async function SitesPage() {
  const sites = process.env.DATABASE_URL
    ? await prisma.site.findMany({
        where: { organizationId: DEFAULT_ORG_ID },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
    : [];

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
}
