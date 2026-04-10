import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_DEV_SEED !== "true"
  ) {
    throw new Error(
      "Refuse to seed development credentials in production environment",
    );
  }

  if (process.env.ALLOW_DEV_SEED !== "true") {
    throw new Error("Set ALLOW_DEV_SEED=true to run development seed");
  }

  const devPassword = process.env.DEV_SEED_PASSWORD;
  if (!devPassword) {
    throw new Error("Missing DEV_SEED_PASSWORD for development seed");
  }

  const passwordHash = await bcrypt.hash(devPassword, 10);

  const user = await prisma.user.upsert({
    where: { email: "owner@accesspilot.dev" },
    update: {
      passwordHash,
    },
    create: {
      email: "owner@accesspilot.dev",
      name: "Default Owner",
      passwordHash,
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
    where: {
      organizationId_userId: {
        organizationId: organization.id,
        userId: user.id,
      },
    },
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
