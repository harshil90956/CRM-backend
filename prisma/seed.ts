import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding AGENT & CUSTOMER users");

  const TENANT_ID = "tenant_default";

  /* =========================
     AGENT
     ========================= */

  const agent = await prisma.user.upsert({
    where: { email: "priyansidholariya@gmail.com" },
    create: {
      name: "Priyanshi Dholariya",
      email: "priyansidholariya@gmail.com",
      role: "AGENT",
      tenantId: TENANT_ID,
      isActive: true,
    },
    update: {
      role: "AGENT",
      tenantId: TENANT_ID,
      isActive: true,
    },
  });

  /* =========================
     CUSTOMER
     ========================= */

  const customer = await prisma.user.upsert({
    where: { email: "vekariyakeyuri50@gmail.com" },
    create: {
      name: "Keyuri Vekariya",
      email: "vekariyakeyuri50@gmail.com",
      role: "CUSTOMER",
      tenantId: TENANT_ID,
      isActive: true,
    },
    update: {
      role: "CUSTOMER",
      tenantId: TENANT_ID,
      isActive: true,
    },
  });

  console.log("✅ Seeded users:", {
    agent: agent.email,
    customer: customer.email,
  });
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
