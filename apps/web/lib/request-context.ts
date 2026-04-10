import { headers } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NoOrganizationError, UnauthenticatedError } from "@/lib/api/errors";

export async function getRequestOrganizationId() {
  const session = await auth();

  if (!session?.user?.email) {
    throw new UnauthenticatedError();
  }

  const headerStore = await headers();
  const explicitOrgId = headerStore.get("x-org-id");

  const members = await prisma.member.findMany({
    where: {
      user: { email: session.user.email },
    },
    select: {
      organizationId: true,
    },
    orderBy: { createdAt: "asc" },
  });

  if (members.length === 0) {
    throw new NoOrganizationError();
  }

  if (explicitOrgId) {
    const matched = members.find(
      (member) => member.organizationId === explicitOrgId,
    );
    if (!matched) {
      throw new NoOrganizationError();
    }
    return matched.organizationId;
  }

  return members[0].organizationId;
}
