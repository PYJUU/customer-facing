import { prisma } from "@/lib/prisma";

export async function ensureUserHasOrganization(userId: string) {
  const member = await prisma.member.findFirst({ where: { userId } });
  if (member) {
    return member.organizationId;
  }

  const organization = await prisma.organization.create({
    data: {
      name: "My Organization",
      ownerId: userId,
      members: {
        create: {
          userId,
          role: "owner",
        },
      },
    },
  });

  return organization.id;
}
