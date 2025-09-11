import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Seed je dobrovoľný – pre booking nepotrebuješ dáta,
  // lebo departures a ceny sú vo WP. Môžeš pridať test rezerváciu:
  await prisma.booking.create({
    data: {
      code: 'DEMO1234',
      departureId: 'wp-departure-1',
      tourSlug: 'pariz-na-vikend',
      email: 'demo@example.com',
      seats: 2,
      unitPriceCents: 12900,
      totalAmount: 25800,
      currency: 'EUR',
      status: 'PENDING',
      passengers: {
        create: [
          { firstName: 'Anna', lastName: 'Novak' },
          { firstName: 'Ivan', lastName: 'Novak' },
        ]
      }
    }
  });
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
