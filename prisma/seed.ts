import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";
import { Pool } from "pg";

async function seedStaff(
  prisma: PrismaClient,
  name: string,
  email: string,
  password: string
) {
  const existing = await prisma.staff.findUnique({
    where: { email },
  });

  if (existing) {
    console.log(`ℹ️ ${email} already exists`);
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.staff.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "ADMIN",     // enum as string (Prisma v7 safe)
      isActive: true,
    },
  });

  console.log(`✅ ${email} created`);
}

async function main() {
  console.log("🌱 Running seed...");

  const connectionString = process.env["DATABASE_URL"];
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    /* ---------- SUPER ADMIN ---------- */
    await seedStaff(
      prisma,
      "Super Admin",
      "superadmin@apexrealty.com",
      "Super@123"
    );

    /* ---------- ADMIN ---------- */
    await seedStaff(
      prisma,
      "Admin",
      "admin@apexrealty.com",
      "Admin@123"
    );

    console.log("🎉 Staff seeding completed");
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  });