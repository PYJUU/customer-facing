import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getRequestOrganizationId() {
  const session = await auth();

  if (!session?.user?.email) {
    throw new Error("UNAUTHENTICATED");
  }

  const member = await prisma.member.findFirst({
    where: {
      user: { email: session.user.email },
    },
    orderBy: { createdAt: "asc" },
  });

  if (!member) {
    throw new Error("NO_ORGANIZATION");
  }

  return member.organizationId;
}
