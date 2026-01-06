// import "dotenv/config";
// import { PrismaClient, StaffRole } from "@prisma/client";
// import bcrypt from "bcrypt";

// async function seedStaff(
//   prisma: PrismaClient,
//   name: string,
//   email: string,
//   password: string,
//   role: StaffRole
// ) {
//   const existing = await prisma.staff.findUnique({
//     where: { email },
//   });

//   if (existing) {
//     console.log(`ℹ️ ${email} already exists`);
//     return;
//   }

//   const hashedPassword = await bcrypt.hash(password, 10);

//   await prisma.staff.create({
//     data: {
//       name,
//       email,
//       password: hashedPassword,
//       role,
//       isActive: true,
//     },
//   });

//   console.log(`✅ ${email} created`);
// }

// async function main() {
//   console.log("🌱 Running seed...");

//   const prisma = new PrismaClient();

//   try {
//     /* ---------- SUPER ADMIN ---------- */
//     await seedStaff(
//       prisma,
//       "Super Admin",
//       "superadmin@apexrealtycrm.com",
//       "123456",
//       StaffRole.SUPER_ADMIN
//     );

//     /* ---------- ADMIN ---------- */
//     await seedStaff(
//       prisma,
//       "Admin",
//       "admin@apexrealtycrm.com",
//       "123456",
//       StaffRole.ADMIN
//     );

//     console.log("🎉 Staff seeding completed");
//   } finally {
//     await prisma.$disconnect();
//   }
// }

// main()
//   .catch((e) => {
//     console.error("❌ Seed failed:", e);
//     process.exit(1);
//   });