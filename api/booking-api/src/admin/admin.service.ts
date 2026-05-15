import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus } from '../common/entities';
import { PrismaService } from '../prisma/prisma.service';
import { activeStatuses, randomCode, withBookedSeats } from '../common/utils';
import { CreateTourDto } from './dto/create-tour.dto';
import { ManualBookingDto } from './dto/manual-booking.dto';

const bookingsInclude = {
  where: { status: { notIn: activeStatuses } },
  select: { seats: true },
};

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getAllTours() {
    const tours = await this.prisma.tour.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        departures: {
          orderBy: { date: 'asc' },
          include: { bookings: bookingsInclude },
        },
      },
    });

    return tours.map(t => ({
      ...t,
      departures: t.departures.map(withBookedSeats),
    }));
  }

  async createTour(dto: CreateTourDto) {
    const existing = await this.prisma.tour.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new BadRequestException(`Zájazd so slugom "${dto.slug}" už existuje`);

    return this.prisma.tour.create({
      data: {
        slug: dto.slug,
        title: dto.title,
        category: dto.category ?? null,
        teaser: dto.teaser ?? null,
        description: dto.description ?? null,
        currency: dto.currency ?? 'EUR',
        heroImage: dto.heroImage ?? null,
        thumbImage: dto.thumbImage ?? null,
        duration: dto.duration ?? null,
        departures: dto.departures?.length
          ? {
              create: dto.departures.map(d => ({
                date: new Date(d.date),
                unitPriceCents: d.unitPriceCents,
                capacity: d.capacity,
              })),
            }
          : undefined,
      },
      include: { departures: true },
    });
  }

  async getAllBookings(tourSlug?: string) {
    return this.prisma.booking.findMany({
      where: tourSlug ? { tourSlug } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        passengers: true,
        departure: { select: { date: true, unitPriceCents: true, capacity: true } },
      },
    });
  }

  async createManualBooking(dto: ManualBookingDto) {
    const departure = await this.prisma.departure.findUnique({
      where: { id: dto.departureId },
      include: { bookings: bookingsInclude },
    });

    if (!departure) throw new NotFoundException('Odchod neexistuje');

    const bookedSeats = departure.bookings.reduce((s, b) => s + b.seats, 0);
    if (bookedSeats + dto.seats > departure.capacity) {
      throw new BadRequestException(
        `Nedostatok miest – voľných: ${departure.capacity - bookedSeats}, požadovaných: ${dto.seats}`,
      );
    }

    const unitPrice = dto.unitPriceCents ?? departure.unitPriceCents;

    return this.prisma.booking.create({
      data: {
        code: randomCode(),
        departureId: dto.departureId,
        tourSlug: dto.tourSlug,
        email: dto.email,
        seats: dto.seats,
        unitPriceCents: unitPrice,
        totalAmount: unitPrice * dto.seats,
        currency: 'EUR',
        status: BookingStatus.CONFIRMED,
        passengers: {
          create: dto.passengers.map(p => ({ firstName: p.firstName, lastName: p.lastName })),
        },
      },
      include: { passengers: true, departure: true },
    });
  }
}
