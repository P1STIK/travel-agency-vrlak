import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

function asArray(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean).map(String);
  return String(val)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

type RawDeparture = {
  date: string;
  unitPriceCents: number;
  capacity?: number;
};

type RawTour = {
  slug: string;
  title: string;
  category?: string;
  teaser?: string;
  description?: string;
  currency?: string;
  heroImage?: string;
  thumbImage?: string;
  duration?: string;
  pickupPoints?: string[] | string;
  gallery?: string[] | string;
  tags?: string[] | string;
  extras?: any;
  departures?: RawDeparture[];
};

const BUSES = [
  { name: 'Autobus 1', licensePlate: 'BA-111AA', color: '#2563eb' },
  { name: 'Autobus 2', licensePlate: 'BA-222BB', color: '#dc2626' },
  { name: 'Autobus 3', licensePlate: 'BA-333CC', color: '#16a34a' },
  { name: 'Autobus 4', licensePlate: 'BA-444DD', color: '#d97706' },
  { name: 'Autobus 5', licensePlate: 'BA-555EE', color: '#7c3aed' },
];

const DRIVERS = [
  { name: 'Ján Novák',       phone: '0901 111 222', color: '#f59e0b' },
  { name: 'Peter Kováč',     phone: '0902 333 444', color: '#8b5cf6' },
  { name: 'Miroslav Horváth',phone: '0903 555 666', color: '#06b6d4' },
  { name: 'Tomáš Varga',     phone: '0904 777 888', color: '#f97316' },
  { name: 'Róbert Szabó',    phone: '0905 999 000', color: '#ec4899' },
];

async function main() {
  for (const b of BUSES) {
    await prisma.bus.upsert({
      where: { licensePlate: b.licensePlate },
      update: { name: b.name, color: b.color },
      create: b,
    });
  }
  console.log(`✅ Seeded ${BUSES.length} buses`);

  for (const d of DRIVERS) {
    await prisma.driver.upsert({
      where: { name: d.name },
      update: { phone: d.phone, color: d.color },
      create: d,
    });
  }
  console.log(`✅ Seeded ${DRIVERS.length} drivers`);

  const file = join(process.cwd(), 'prisma', 'seed', 'tours.json');
  const tours = JSON.parse(readFileSync(file, 'utf8')) as RawTour[];

  for (const t of tours) {
    const { slug } = t;
    const departures = t.departures ?? [];

    const data = {
      title: t.title,
      category: t.category ?? null,
      teaser: t.teaser ?? null,
      description: t.description ?? null,
      currency: t.currency ?? 'EUR',
      heroImage: t.heroImage ?? null,
      thumbImage: t.thumbImage ?? null,
      duration: t.duration ?? null,
      pickupPoints: asArray(t.pickupPoints),
      gallery: asArray(t.gallery),
      tags: asArray(t.tags),
      extras: t.extras ?? null,
    };

    const tour = await prisma.tour.upsert({
      where: { slug },
      update: data,
      create: {
        slug,
        ...data
      }
    });

    const existingBookingCount = await prisma.booking.count({
      where: { departure: { tourId: tour.id } },
    });

    if (existingBookingCount === 0 && departures.length) {
      await prisma.departure.deleteMany({ where: { tourId: tour.id } });
      await prisma.departure.createMany({
        data: departures.map((d) => ({
          tourId: tour.id,
          date: new Date(d.date),
          unitPriceCents: Number(d.unitPriceCents),
          capacity: d.capacity ?? 50,
        })),
      });
    }

    console.log('Seeded:', slug);
  }

  console.log(`✅ Seed hotový: ${tours.length} záznamov (upsert podľa slug)`);
}

main()
  .catch((e) => {
    console.error('❌ Seed zlyhal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });