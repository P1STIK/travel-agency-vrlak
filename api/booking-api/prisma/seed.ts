import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

function asArray(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  return String(val).split(',').map(s => s.trim()).filter(Boolean);
}

async function main() {
  const file = join(process.cwd(), 'prisma', 'seed', 'tours.json');
  const tours = JSON.parse(readFileSync(file, 'utf8')) as any[];

  for (const t of tours) {
    const { departures = [], slug, ...rest } = t;

    const tour = await prisma.tour.upsert({
      where: { slug },
      update: {
        ...rest,
        currency: rest.currency ?? 'EUR',
        teaser: rest.teaser ?? null,
        description: rest.description ?? null,
        heroImage: rest.heroImage ?? null,
        thumbImage: rest.thumbImage ?? null,
        duration: rest.duration ?? null,
        pickupPoints: asArray(rest.pickupPoints),
        gallery: asArray(rest.gallery),
      },
      create: {
        slug,
        ...rest,
        currency: rest.currency ?? 'EUR',
        teaser: rest.teaser ?? null,
        description: rest.description ?? null,
        heroImage: rest.heroImage ?? null,
        thumbImage: rest.thumbImage ?? null,
        duration: rest.duration ?? null,
        pickupPoints: asArray(rest.pickupPoints),
        gallery: asArray(rest.gallery),
      },
    });

    // refresh departures robustne (mimo nested write)
    await prisma.departure.deleteMany({ where: { tourId: tour.id } });
    if (departures.length) {
      await prisma.departure.createMany({
        data: departures.map((d: any) => ({
          tourId: tour.id,
          date: new Date(d.date),
          unitPriceCents: Number(d.unitPriceCents),
        })),
      });
    }

    console.log('Seeded:', slug);
  }

  console.log(`✅ Seed hotový: ${tours.length} zájazdov`);
}

main()
  .catch((e) => {
    console.error('❌ Seed zlyhal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });