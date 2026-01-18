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
  id?: string;
  date: string;
  unitPriceCents: number;
};

type RawTour = {
  slug: string;
  title: string;
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

async function main() {
  const file = join(process.cwd(), 'prisma', 'seed', 'tours.json');
  const tours = JSON.parse(readFileSync(file, 'utf8')) as RawTour[];

  for (const t of tours) {
    const { slug } = t;
    const departures = t.departures ?? [];

    const data = {
      title: t.title,
      teaser: t.teaser ?? null,
      description: t.description ?? null,
      currency: t.currency ?? 'EUR',
      heroImage: t.heroImage ?? null,
      thumbImage: t.thumbImage ?? null,
      duration: t.duration ?? null,
      pickupPoints: asArray(t.pickupPoints),
      gallery: asArray(t.gallery),
      tags: asArray(t.tags),
      extras: t.extras ?? null
    };

    const tour = await prisma.tour.upsert({
      where: { slug },
      update: data,
      create: {
        slug,
        ...data
      }
    });

    // refresh departures mimo nested write
    await prisma.departure.deleteMany({ where: { tourId: tour.id } });

    if (departures.length) {
      await prisma.departure.createMany({
        data: departures.map((d) => ({
          tourId: tour.id,
          date: new Date(d.date),
          unitPriceCents: Number(d.unitPriceCents)
        }))
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