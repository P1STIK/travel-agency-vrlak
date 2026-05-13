import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ToursService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const tours = await this.prisma.tour.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        departures: {
          orderBy: { date: 'asc' },
          include: {
            bookings: {
              where: { status: { notIn: ['CANCELLED', 'REFUNDED'] } },
              select: { seats: true },
            },
          },
        },
      },
    });

    return tours.map((t) => ({
      ...t,
      minPriceCents: t.departures.length
        ? Math.min(...t.departures.map((d) => d.unitPriceCents))
        : null,
      firstDeparture: t.departures[0]?.date ?? null,
      departures: t.departures.map(({ bookings, ...d }) => ({
        ...d,
        bookedSeats: bookings.reduce((sum, b) => sum + b.seats, 0),
      })),
    }));
  }

  async findBySlug(slug: string) {
    const tour = await this.prisma.tour.findUnique({
      where: { slug },
      include: {
        departures: {
          orderBy: { date: 'asc' },
          include: {
            bookings: {
              where: { status: { notIn: ['CANCELLED', 'REFUNDED'] } },
              select: { seats: true },
            },
          },
        },
      },
    });

    if (!tour) throw new NotFoundException('Tour not found');

    return {
      ...tour,
      minPriceCents: tour.departures.length
        ? Math.min(...tour.departures.map((d) => d.unitPriceCents))
        : null,
      firstDeparture: tour.departures[0]?.date ?? null,
      departures: tour.departures.map(({ bookings, ...d }) => ({
        ...d,
        bookedSeats: bookings.reduce((sum, b) => sum + b.seats, 0),
      })),
    };
  }
}
