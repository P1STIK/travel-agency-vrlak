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

  // Termíny, ktoré už odišli, sa verejne neponúkajú na vyhľadávanie/rezerváciu —
  // zostávajú ale v DB ako história (bookings, admin prehľady vidia všetko ďalej,
  // lebo admin modul ide priamo cez Prisma, nie cez tento service).
  private onlyFutureDepartures<T extends { date: Date }>(departures: T[]): T[] {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return departures.filter((d) => d.date >= startOfToday);
  }

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

    return tours
      .map((t) => ({ ...t, departures: this.onlyFutureDepartures(t.departures) }))
      .filter((t) => t.departures.length > 0)
      .map((t) => ({
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

    const futureDepartures = this.onlyFutureDepartures(tour.departures);

    return {
      ...tour,
      minPriceCents: futureDepartures.length ? Math.min(...futureDepartures.map((d) => d.unitPriceCents)) : null,
      firstDeparture: futureDepartures[0]?.date ?? null,
      departures: futureDepartures.map(withBookedSeats),
    };
  }
}
