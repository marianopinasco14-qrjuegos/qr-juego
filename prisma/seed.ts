const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed...");

  // Planes
  const planStarter = await prisma.plan.upsert({
    where: { slug: "starter" },
    update: {},
    create: {
      id: "plan_starter",
      slug: "starter",
      name: "Starter",
      description: "Para empezar sin costo",
      maxQrGames: 2,
      maxScansPerQr: 500,
      maxLeads: 1000,
      price: 0,
      yearlyPrice: 0,
      trialDays: 14,
      sortOrder: 0,
      whiteLabelEnabled: false,
      webhooksEnabled: false,
      affiliatesEnabled: false,
      features: JSON.stringify(["2 juegos QR", "500 escaneos/juego", "1.000 leads", "Soporte por email"]),
    },
  });

  const planGrowth = await prisma.plan.upsert({
    where: { slug: "growth" },
    update: {},
    create: {
      id: "plan_growth",
      slug: "growth",
      name: "Growth",
      description: "Para negocios en crecimiento",
      maxQrGames: 5,
      maxScansPerQr: 2000,
      maxLeads: 5000,
      price: 29.99,
      yearlyPrice: 287.9,
      trialDays: 14,
      sortOrder: 1,
      whiteLabelEnabled: false,
      webhooksEnabled: true,
      affiliatesEnabled: false,
      features: JSON.stringify([
        "5 juegos QR",
        "2.000 escaneos/juego",
        "5.000 leads",
        "Webhooks (Make/Zapier)",
        "Soporte prioritario",
      ]),
    },
  });

  await prisma.plan.upsert({
    where: { slug: "pro" },
    update: {},
    create: {
      id: "plan_pro",
      slug: "pro",
      name: "Pro",
      description: "Sin límites para equipos grandes",
      maxQrGames: 20,
      maxScansPerQr: 10000,
      maxLeads: 999999,
      price: 99.99,
      yearlyPrice: 959.9,
      trialDays: 14,
      sortOrder: 2,
      whiteLabelEnabled: true,
      webhooksEnabled: true,
      affiliatesEnabled: true,
      features: JSON.stringify([
        "20 juegos QR",
        "10.000 escaneos/juego",
        "Leads ilimitados",
        "White label",
        "Webhooks (Make/Zapier)",
        "Módulo de afiliados",
        "Soporte 24/7",
      ]),
    },
  });

  // Usuario admin
  const adminEmail = process.env.SUPERADMIN_EMAIL || "admin@qrjuego.com";
  const adminPassword = process.env.SUPERADMIN_PASSWORD || "Admin123!";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const org = await prisma.organization.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "QR Juego Admin",
      slug: "qrjuego-admin",
      email: adminEmail,
      planId: planGrowth.id,
      subscriptionStatus: "ACTIVE",
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      organizationId: org.id,
      email: adminEmail,
      passwordHash,
      name: "Super Admin",
      role: "SUPERADMIN",
    },
  });

  console.log("Usuario admin creado:", adminEmail);

  // Cupón de demo
  await prisma.coupon.upsert({
    where: { code: "TRIAL30" },
    update: {},
    create: {
      code: "TRIAL30",
      description: "30% de descuento en cualquier plan",
      type: "PERCENTAGE",
      value: 30,
      maxUses: 100,
      isActive: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: "LAUNCH50" },
    update: {},
    create: {
      code: "LAUNCH50",
      description: "50% de descuento — Lanzamiento",
      type: "PERCENTAGE",
      value: 50,
      maxUses: 50,
      isActive: true,
    },
  });

  console.log("Cupones de demo creados");

  // Campañas demo
  const slugRuleta = "demo-ruleta-2024";
  if (!(await prisma.campaign.findUnique({ where: { qrSlug: slugRuleta } }))) {
    const c = await prisma.campaign.create({
      data: {
        organizationId: org.id,
        name: "Demo: Ruleta del Restaurante",
        gameType: "RULETA",
        attemptsPerSession: 3,
        status: "ACTIVE",
        primaryColor: "#7C3AED",
        secondaryColor: "#A78BFA",
        backgroundColor: "#1a1a2e",
        language: "es",
        formFields: JSON.stringify([{ id: "nombre", label: "Nombre y apellido", type: "text", required: true }]),
        upsellEnabled: true,
        upsellTitle: "Hamburguesa Premium 20% OFF",
        upsellPrice: 1200,
        upsellCurrency: "ARS",
        upsellLink: "https://wa.me/5491100000000",
        closedBehavior: "LEAD_MAGNET",
        qrSlug: slugRuleta,
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    });
    await prisma.prize.createMany({
      data: [
        { campaignId: c.id, title: "Postre Gratis", description: "Un postre a elección", stock: 20, priority: 7, frequency: 10, validDays: 7 },
        { campaignId: c.id, title: "Bebida Gratis", description: "Una bebida gratis", stock: 50, priority: 9, frequency: 5, validDays: 14 },
        { campaignId: c.id, title: "Pizza 2x1", description: "Dos pizzas por el precio de una", stock: 5, priority: 3, frequency: 50, validDays: 30 },
      ],
    });
    await prisma.consolePrize.create({ data: { campaignId: c.id, title: "Café Gratis", description: "Te invitamos un café", couponCode: "CAFE-DEMO-2024" } });
    await prisma.emailTemplate.createMany({
      data: [
        { campaignId: c.id, type: "WINNER", subject: "¡Ganaste un premio!", bodyHtml: "<h1>¡Felicitaciones {{name}}! Ganaste: {{prize}}</h1><p>Tu código: {{redemptionCode}}</p><p>Válido hasta: {{expiresAt}}</p>" },
        { campaignId: c.id, type: "CONSOLE", subject: "Tu regalo te espera", bodyHtml: "<h1>¡Gracias por participar!</h1><p>Tu código: {{couponCode}}</p>" },
      ],
    });
    console.log("Campaña Ruleta creada:", slugRuleta);
  }

  const slugSlots = "demo-slots-2024";
  if (!(await prisma.campaign.findUnique({ where: { qrSlug: slugSlots } }))) {
    const c = await prisma.campaign.create({
      data: {
        organizationId: org.id,
        name: "Demo: Tragamonedas Bar",
        gameType: "SLOTS",
        attemptsPerSession: 1,
        status: "ACTIVE",
        primaryColor: "#D97706",
        secondaryColor: "#FCD34D",
        backgroundColor: "#1c1008",
        language: "es",
        formFields: JSON.stringify([{ id: "nombre", label: "Nombre y apellido", type: "text", required: true }]),
        upsellEnabled: true,
        upsellTitle: "Happy Hour 2x1 cervezas",
        upsellPrice: 800,
        upsellCurrency: "ARS",
        upsellLink: "https://wa.me/5491100000000",
        closedBehavior: "LEAD_MAGNET",
        qrSlug: slugSlots,
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    });
    await prisma.prize.createMany({
      data: [
        { campaignId: c.id, title: "Cerveza Gratis", description: "Una pinta gratis", stock: 30, priority: 8, frequency: 8, validDays: 3 },
        { campaignId: c.id, title: "Jackpot: Noche para 2", description: "Cena para dos personas", stock: 2, priority: 2, frequency: 100, validDays: 60 },
      ],
    });
    await prisma.consolePrize.create({ data: { campaignId: c.id, title: "Snack Gratis", description: "Un bowl de maníes gratis", couponCode: "SNACK-BAR-2024" } });
    await prisma.emailTemplate.createMany({
      data: [
        { campaignId: c.id, type: "WINNER", subject: "¡Jackpot! Ganaste en el Bar", bodyHtml: "<h1>JACKPOT {{name}}! Ganaste: {{prize}}</h1><p>Código: {{redemptionCode}}</p>" },
        { campaignId: c.id, type: "CONSOLE", subject: "Tu snack gratis te espera", bodyHtml: "<h1>¡Gracias por jugar!</h1><p>Código: {{couponCode}}</p>" },
      ],
    });
    console.log("Campaña Slots creada:", slugSlots);
  }

  const slugRasca = "demo-rasca-2024";
  if (!(await prisma.campaign.findUnique({ where: { qrSlug: slugRasca } }))) {
    const c = await prisma.campaign.create({
      data: {
        organizationId: org.id,
        name: "Demo: Rasca y Gana Tienda",
        gameType: "RASCA_Y_GANA",
        attemptsPerSession: 1,
        status: "ACTIVE",
        primaryColor: "#059669",
        secondaryColor: "#34D399",
        backgroundColor: "#0a1f0f",
        language: "es",
        formFields: JSON.stringify([{ id: "nombre", label: "Nombre y apellido", type: "text", required: true }]),
        upsellEnabled: false,
        closedBehavior: "LEAD_MAGNET",
        qrSlug: slugRasca,
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    });
    await prisma.prize.createMany({
      data: [
        { campaignId: c.id, title: "10% de Descuento", description: "Descuento en tu próxima compra", stock: 100, priority: 9, frequency: 3, validDays: 30 },
        { campaignId: c.id, title: "Producto Gratis", description: "Un producto hasta $500 gratis", stock: 10, priority: 4, frequency: 20, validDays: 15 },
      ],
    });
    await prisma.consolePrize.create({ data: { campaignId: c.id, title: "5% de Descuento", description: "Descuento especial por participar", couponCode: "GRACIAS5-TIENDA" } });
    await prisma.emailTemplate.createMany({
      data: [
        { campaignId: c.id, type: "WINNER", subject: "¡Ganaste en la Tienda!", bodyHtml: "<h1>¡Felicitaciones {{name}}! Ganaste: {{prize}}</h1><p>Código: {{redemptionCode}}</p>" },
        { campaignId: c.id, type: "CONSOLE", subject: "Tu descuento especial", bodyHtml: "<h1>¡Gracias por participar!</h1><p>Código: {{couponCode}}</p>" },
      ],
    });
    console.log("Campaña Rasca creada:", slugRasca);
  }

  if (!(await prisma.staffPin.findFirst({ where: { organizationId: org.id } }))) {
    await prisma.staffPin.createMany({
      data: [
        { organizationId: org.id, pin: "123456", staffName: "María García" },
        { organizationId: org.id, pin: "654321", staffName: "Carlos López" },
        { organizationId: org.id, pin: "111222", staffName: "Ana Martínez" },
      ],
    });
    console.log("Staff PINs creados: 123456 / 654321 / 111222");
  }

  console.log("\n✅ Seed completado!");
  console.log("Login:", adminEmail, "/ Password:", adminPassword);
  console.log("Juego Ruleta: /play/demo-ruleta-2024");
  console.log("Juego Slots:  /play/demo-slots-2024");
  console.log("Juego Rasca:  /play/demo-rasca-2024");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
