import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';

@Injectable()
export class ToursService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const tours = await this.prisma.tour.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        departures: { orderBy: { date: 'asc' } },
      },
    });

    // doplníme pár derived fieldov (dobré pre FE, ale nie je nutné)
    return tours.map((t) => ({
      ...t,
      minPriceCents: t.departures.length
        ? Math.min(...t.departures.map((d) => d.unitPriceCents))
        : null,
      firstDeparture: t.departures[0]?.date ?? null,
    }));
  }

  async findBySlug(slug: string) {
    const tour = await this.prisma.tour.findUnique({
      where: { slug },
      include: {
        departures: { orderBy: { date: 'asc' } },
      },
    });

    if (!tour) throw new NotFoundException('Tour not found');

    return {
      ...tour,
      minPriceCents: tour.departures.length
        ? Math.min(...tour.departures.map((d) => d.unitPriceCents))
        : null,
      firstDeparture: tour.departures[0]?.date ?? null,
    };
  }
}