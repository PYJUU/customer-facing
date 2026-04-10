import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getRequestOrganizationId } from "@/lib/request-context";
import { rateLimit } from "@/lib/security/rate-limit";
import { normalizePublicBaseUrl } from "@/lib/security/url-guard";

const siteInput = z.object({
  name: z.string().min(1).max(100),
  baseUrl: z.string().min(1),
  platform: z.enum(["shopify", "woocommerce", "custom"]).default("custom"),
});

export async function POST(req: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "服务暂不可用：缺少 DATABASE_URL" },
      { status: 503 },
    );
  }

  try {
    const orgId = await getRequestOrganizationId();
    const limitResult = rateLimit(`site-create:${orgId}`, 20, 60_000);
    if (!limitResult.allowed) {
      return NextResponse.json(
        { error: "请求过于频繁，请稍后重试" },
        { status: 429 },
      );
    }

    const body = await req.json();
    const parsed = siteInput.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "参数不合法", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const baseUrl = normalizePublicBaseUrl(parsed.data.baseUrl);
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
    });
    if (!organization) {
      return NextResponse.json({ error: "组织不存在" }, { status: 400 });
    }

    const existed = await prisma.site.findFirst({
      where: {
        organizationId: organization.id,
        baseUrl,
      },
    });

    if (existed) {
      return NextResponse.json({ error: "该站点已存在" }, { status: 409 });
    }

    const site = await prisma.site.create({
      data: {
        name: parsed.data.name,
        baseUrl,
        platform: parsed.data.platform,
        organizationId: organization.id,
      },
    });

    return NextResponse.json(site, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "服务异常";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
