import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEMO_EMAIL = "demo@quoteflow.app";
const DEMO_PASSWORD = "Demo1234!";

async function main() {
  const existingUser = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
  });
  if (existingUser) {
    await prisma.organization.delete({ where: { id: existingUser.organizationId } });
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const org = await prisma.organization.create({
    data: {
      name: "Contratistas Rivera",
      users: {
        create: {
          name: "Demo User",
          email: DEMO_EMAIL,
          passwordHash,
        },
      },
    },
  });

  const [martillo, torres, espiga, villaDelSol] = await Promise.all([
    prisma.client.create({
      data: {
        organizationId: org.id,
        name: "Ferretería Los Tres Hermanos",
        phone: "787-555-0142",
        email: "compras@lostreshermanos.example",
        address: "Calle Comercio 45, San Juan, PR",
      },
    }),
    prisma.client.create({
      data: {
        organizationId: org.id,
        name: "Sra. Carmen Torres",
        phone: "787-555-0198",
        email: "carmen.torres@example.com",
        address: "Urb. Las Flores, Calle 8 #12, Bayamón, PR",
      },
    }),
    prisma.client.create({
      data: {
        organizationId: org.id,
        name: "Panadería La Espiga",
        phone: "787-555-0163",
        email: "gerencia@laespiga.example",
        address: "Ave. Muñoz Marín 210, Caguas, PR",
      },
    }),
    prisma.client.create({
      data: {
        organizationId: org.id,
        name: "Complejo Villa del Sol",
        phone: "787-555-0177",
        email: "admin@villadelsol.example",
        address: "Carr. 3 Km 12.4, Carolina, PR",
      },
    }),
  ]);

  await prisma.quote.create({
    data: {
      organizationId: org.id,
      clientId: torres.id,
      title: "Reparación de techo",
      status: "DRAFT",
      notes: "Cliente reportó filtración en la esquina noreste del techo.",
      items: {
        create: [
          { description: "Inspección y diagnóstico", quantity: 1, unitPrice: 75, order: 0 },
          { description: "Materiales impermeabilizantes", quantity: 3, unitPrice: 120, order: 1 },
          { description: "Mano de obra (2 días)", quantity: 2, unitPrice: 250, order: 2 },
        ],
      },
    },
  });

  await prisma.quote.create({
    data: {
      organizationId: org.id,
      clientId: torres.id,
      title: "Remodelación de cocina",
      status: "SENT",
      notes: "Incluye cambio de gabinetes y encimera.",
      items: {
        create: [
          { description: "Gabinetes de cocina (juego completo)", quantity: 1, unitPrice: 2400, order: 0 },
          { description: "Encimera de cuarzo", quantity: 1, unitPrice: 1600, order: 1 },
          { description: "Instalación y acabados", quantity: 1, unitPrice: 900, order: 2 },
        ],
      },
    },
  });

  const painting = await prisma.quote.create({
    data: {
      organizationId: org.id,
      clientId: espiga.id,
      title: "Pintura exterior del local",
      status: "APPROVED",
      notes: "Colores según muestra aprobada por el cliente.",
      items: {
        create: [
          { description: "Preparación de superficie", quantity: 1, unitPrice: 300, order: 0 },
          { description: "Pintura exterior (5 galones)", quantity: 5, unitPrice: 45, order: 1 },
          { description: "Mano de obra", quantity: 3, unitPrice: 200, order: 2 },
        ],
      },
    },
  });

  const electrical = await prisma.quote.create({
    data: {
      organizationId: org.id,
      clientId: villaDelSol.id,
      title: "Instalación eléctrica área común",
      status: "REJECTED",
      notes: "Cliente decidió posponer el proyecto para el próximo trimestre.",
      items: {
        create: [
          { description: "Panel eléctrico nuevo", quantity: 1, unitPrice: 850, order: 0 },
          { description: "Cableado (100 pies)", quantity: 100, unitPrice: 3.5, order: 1 },
          { description: "Mano de obra certificada", quantity: 2, unitPrice: 300, order: 2 },
        ],
      },
    },
  });

  await prisma.quote.create({
    data: {
      organizationId: org.id,
      clientId: martillo.id,
      title: "Reparación de plomería",
      status: "SENT",
      notes: null,
      items: {
        create: [
          { description: "Reemplazo de tubería principal", quantity: 1, unitPrice: 480, order: 0 },
          { description: "Grifería nueva", quantity: 2, unitPrice: 95, order: 1 },
        ],
      },
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        organizationId: org.id,
        quoteId: painting.id,
        event: "QUOTE_APPROVED",
        recipient: DEMO_EMAIL,
        subject: `Quote approved: ${painting.title}`,
        body: "Good news — the client approved this quote.",
        status: "SENT",
        sentAt: new Date(),
      },
      {
        organizationId: org.id,
        quoteId: electrical.id,
        event: "QUOTE_REJECTED",
        recipient: DEMO_EMAIL,
        subject: `Quote rejected: ${electrical.title}`,
        body: "The client rejected this quote.",
        status: "SENT",
        sentAt: new Date(),
      },
    ],
  });

  console.log(`Seeded demo org "${org.name}" — log in with ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
