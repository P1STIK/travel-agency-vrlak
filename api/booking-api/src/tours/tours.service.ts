import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { activeStatuses, withBookedSeats } from '../common/utils';

const bookingsInclude = {
  where: { status: { notIn: activeStatuses } },
  select: { seats: true },
};

@Injectable()
export class ToursService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const tours = await this.prisma.tour.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        departures: {
          orderBy: { date: 'asc' },
          include: { bookings: bookingsInclude },
        },
      },
    });

    return tours.map((t) => ({
      ...t,
      minPriceCents: t.departures.length ? Math.min(...t.departures.map((d) => d.unitPriceCents)) : null,
      firstDeparture: t.departures[0]?.date ?? null,
      departures: t.departures.map(withBookedSeats),
    }));
  }

  async findBySlug(slug: string) {
    const tour = await this.prisma.tour.findUnique({
      where: { slug },
      include: {
        departures: {
          orderBy: { date: 'asc' },
          include: { bookings: bookingsInclude },
        },
      },
    });

    if (!tour) throw new NotFoundException('Tour not found');

    return {
      ...tour,
      minPriceCents: tour.departures.length ? Math.min(...tour.departures.map((d) => d.unitPriceCents)) : null,
      firstDeparture: tour.departures[0]?.date ?? null,
      departures: tour.departures.map(withBookedSeats),
    };
  }
}
