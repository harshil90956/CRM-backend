/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // -----------------------------
  // Passwords
  // -----------------------------
  const superAdminPassword = await bcrypt.hash("SuperAdmin@123", 10);
  const adminPassword = await bcrypt.hash("Admin@123", 10);
  const managerPassword = await bcrypt.hash("Manager@123", 10);
  const agentPassword = await bcrypt.hash("Agent@123", 10);

  // -----------------------------
  // STAFF (Super Admin, Admin, Manager, Agent)
  // -----------------------------
  const superAdmin = await prisma.staff.create({
    data: {
      name: "Super Admin",
      email: "superadmin@crm.com",
      role: "ADMIN",
      password: superAdminPassword,
      isActive: true,
    },
  });

  const admin = await prisma.staff.create({
    data: {
      name: "Admin User",
      email: "admin@crm.com",
      role: "ADMIN",
      password: adminPassword,
      isActive: true,
    },
  });

  const manager = await prisma.staff.create({
    data: {
      name: "Manager User",
      email: "manager@crm.com",
      role: "MANAGER",
      password: managerPassword,
      isActive: true,
    },
  });

  const agent = await prisma.staff.create({
    data: {
      name: "Agent User",
      email: "agent@crm.com",
      role: "AGENT",
      password: agentPassword,
      isActive: true,
    },
  });

  console.log("✅ Staff seeded");

  // -----------------------------
  // PROJECTS
  // -----------------------------
  const project1 = await prisma.project.create({
    data: {
      name: "Apex Residency",
      location: "Ahmedabad",
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: "Skyline Heights",
      location: "Surat",
    },
  });

  console.log("✅ Projects seeded");

  // -----------------------------
  // UNITS
  // -----------------------------
  const unit1 = await prisma.unit.create({
    data: {
      unitNo: "A-101",
      status: "AVAILABLE",
      projectId: project1.id,
    },
  });

  const unit2 = await prisma.unit.create({
    data: {
      unitNo: "A-102",
      status: "AVAILABLE",
      projectId: project1.id,
    },
  });

  const unit3 = await prisma.unit.create({
    data: {
      unitNo: "B-201",
      status: "AVAILABLE",
      projectId: project2.id,
    },
  });

  console.log("✅ Units seeded");

  // -----------------------------
  // CUSTOMERS
  // -----------------------------
  const customer1 = await prisma.customer.create({
    data: {
      name: "Ravi Patel",
      email: "ravi@gmail.com",
      phone: "9999999999",
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: "Neha Shah",
      email: "neha@gmail.com",
      phone: "8888888888",
    },
  });

  console.log("✅ Customers seeded");

  // -----------------------------
  // LEADS
  // -----------------------------
  await prisma.lead.create({
    data: {
      name: "Ravi Patel",
      phone: "9999999999",
      staffId: agent.id,
      customerId: customer1.id,
    },
  });

  await prisma.lead.create({
    data: {
      name: "Neha Shah",
      phone: "8888888888",
      staffId: agent.id,
      customerId: customer2.id,
    },
  });

  console.log("✅ Leads seeded");

  console.log("🎉 Database seeding completed successfully");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });