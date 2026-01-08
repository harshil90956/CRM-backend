import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database (SCHEMA-ACCURATE)");

  const TENANT_ID = "tenant_default";

  /* =========================
     USERS (SUPER_ADMIN / ADMIN / MANAGER / AGENT / CUSTOMER)
     ========================= */

  const superAdmin = await prisma.user.upsert({
    where: { email: "priyansidholariya@gmail.com" },
    create: {
      name: "Harshil Dobariya",
      email: "priyansidholariya@gmail.com",
      phone: "9999999999",
      role: "SUPER_ADMIN",
      tenantId: TENANT_ID,
    },
    update: {},
  });

  const admin = await prisma.user.upsert({
    where: { email: "devanshee.chodvadiya@gmail.com" },
    create: {
      name: "Devanshee Chodvadiya",
      email: "devanshee.chodvadiya@gmail.com",
      phone: "9000000000",
      role: "ADMIN",
      tenantId: TENANT_ID,
      managerId: superAdmin.id,
    },
    update: {},
  });

  const manager = await prisma.user.upsert({
    where: { email: "priyagogdani88@gmail.com" },
    create: {
      name: "Priya Gogdani",
      email: "priyagogdani88@gmail.com",
      phone: "8888888888",
      role: "MANAGER",
      tenantId: TENANT_ID,
      managerId: superAdmin.id,
    },
    update: {},
  });

  const agent = await prisma.user.upsert({
    where: { email: "agent@crm.com" },
    create: {
      name: "Sales Agent",
      email: "agent@crm.com",
      phone: "7777777777",
      role: "AGENT",
      tenantId: TENANT_ID,
      managerId: manager.id,
    },
    update: {},
  });

  const customer = await prisma.user.upsert({
    where: { email: "customer@crm.com" },
    create: {
      name: "Customer One",
      email: "customer@crm.com",
      phone: "6666666666",
      role: "CUSTOMER",
      tenantId: TENANT_ID,
    },
    update: {},
  });

  /* =========================
     EMAIL OTP
     ========================= */

  await prisma.emailOtp.createMany({
    data: [
      {
        email: superAdmin.email,
        code: "123456",
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        used: false,
      },
    ],
    skipDuplicates: true,
  });

  /* =========================
     PROJECT
     ========================= */

  const project = await prisma.project.create({
    data: {
      name: "Skyline Residency",
      location: "Ahmedabad",
      mainType: "Residential",
      priceRange: "₹75L - ₹1.2Cr",
      status: "Active",
      tenantId: TENANT_ID,
    },
  });

  /* =========================
     UNIT
     ========================= */

  const unit = await prisma.unit.create({
    data: {
      unitNo: "A-101",
      projectId: project.id,
      status: "AVAILABLE",
      price: 8500000,
      bedrooms: 3,
      bathrooms: 2,
      floorNumber: 1,
      tenantId: TENANT_ID,
    },
  });

  /* =========================
     LEAD
     ========================= */

  const lead = await prisma.lead.create({
    data: {
      name: "Ramesh Patel",
      email: "ramesh@gmail.com",
      phone: "9123456789",
      status: "NEW",
      source: "Website",
      priority: "High",
      budget: "₹80L - ₹1Cr",
      notes: "Interested in 3BHK",
      projectId: project.id,
      assignedToId: agent.id,
      tenantId: TENANT_ID,
    },
  });

  /* =========================
     ACTIVITY
     ========================= */

  await prisma.activity.create({
    data: {
      leadId: lead.id,
      type: "call",
      message: "Initial call done with customer",
      createdBy: agent.id,
      tenantId: TENANT_ID,
    },
  });

  /* =========================
     BOOKING
     ========================= */

  const booking = await prisma.booking.create({
    data: {
      customerId: customer.id,
      unitId: unit.id,
      projectId: project.id,
      agentId: agent.id,
      managerId: manager.id,
      totalPrice: 8500000,
      tokenAmount: 100000,
      status: "HOLD_REQUESTED",
      tenantId: TENANT_ID,
    },
  });

  /* =========================
     PAYMENT
     ========================= */

  const payment = await prisma.payment.create({
    data: {
      bookingId: booking.id,
      customerId: customer.id,
      unitId: unit.id,
      amount: 100000,
      status: "Pending",
      method: "UPI",
      tenantId: TENANT_ID,
    },
  });

  /* =========================
     PAYMENT REMINDER
     ========================= */

  await prisma.paymentReminder.create({
    data: {
      paymentId: payment.id,
      type: "email",
      message: "Token payment reminder",
      status: "SCHEDULED",
      scheduledAt: new Date(Date.now() + 86400000),
      tenantId: TENANT_ID,
    },
  });

  /* =========================
     REVIEW
     ========================= */

  await prisma.review.create({
    data: {
      type: "property",
      targetId: project.id,
      customerId: customer.id,
      rating: 5,
      comment: "Great project and smooth process!",
      status: "approved",
      tenantId: TENANT_ID,
    },
  });

  console.log("✅ Seeding completed successfully");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
