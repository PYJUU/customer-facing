import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "owner@accesspilot.dev" },
    update: {},
    create: {
      email: "owner@accesspilot.dev",
      name: "Default Owner",
    },
  });

  const organization = await prisma.organization.upsert({
    where: { id: "default-org" },
    update: {},
    create: {
      id: "default-org",
      name: "Default Organization",
      ownerId: user.id,
    },
  });

  await prisma.member.upsert({
    where: { organizationId_userId: { organizationId: organization.id, userId: user.id } },
    update: {},
    create: {
      organizationId: organization.id,
      userId: user.id,
      role: "owner",
    },
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
