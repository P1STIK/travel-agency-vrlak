import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus } from '../common/entities';
import { PrismaService } from '../prisma/prisma.service';
import { activeStatuses, randomCode, withBookedSeats } from '../common/utils';
import { CreateTourDto } from './dto/create-tour.dto';
import { ManualBookingDto } from './dto/manual-booking.dto';
import { AssignDriverDto, CreateScheduledRideDto, UpdateScheduledRideDto } from './dto/scheduled-ride.dto';

const inactiveStatuses = new Set<string>([BookingStatus.CANCELLED, BookingStatus.REFUNDED]);

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

  async getTourDetail(slug: string) {
    const tour = await this.prisma.tour.findUnique({
      where: { slug },
      include: {
        departures: {
          orderBy: { date: 'asc' },
          include: {
            bookings: {
              orderBy: { createdAt: 'desc' },
              include: { passengers: true },
            },
          },
        },
      },
    });

    if (!tour) throw new NotFoundException('Zájazd neexistuje');

    return {
      ...tour,
      departures: tour.departures.map(dep => ({
        ...dep,
        bookedSeats: dep.bookings
          .filter(b => !inactiveStatuses.has(b.status))
          .reduce((sum, b) => sum + b.seats, 0),
      })),
    };
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

  async getDrivers() {
    return this.prisma.driver.findMany({ orderBy: { name: 'asc' } });
  }

  async getCalendar(from: string, to: string) {
    const start = new Date(from);
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);

    const [departures, scheduledRides] = await Promise.all([
      this.prisma.departure.findMany({
        where: { date: { gte: start, lte: end } },
        include: {
          tour: { select: { slug: true, title: true } },
          driver: true,
          bus: true,
          bookings: { select: { seats: true, status: true } },
        },
        orderBy: { date: 'asc' },
      }),
      this.prisma.scheduledRide.findMany({
        where: { date: { gte: start, lte: end } },
        include: { driver: true, bus: true },
        orderBy: { date: 'asc' },
      }),
    ]);

    return {
      departures: departures.map(d => ({
        ...d,
        bookedSeats: d.bookings
          .filter(b => !new Set([BookingStatus.CANCELLED, BookingStatus.REFUNDED]).has(b.status as BookingStatus))
          .reduce((s, b) => s + b.seats, 0),
      })),
      scheduledRides,
    };
  }

  async assignDepartureDriver(id: string, dto: AssignDriverDto) {
    const dep = await this.prisma.departure.findUnique({ where: { id } });
    if (!dep) throw new NotFoundException('Odchod neexistuje');
    return this.prisma.departure.update({
      where: { id },
      data: {
        driverId: dto.driverId ?? null,
        ...('time' in dto && { time: dto.time ?? null }),
        ...('timeTo' in dto && { timeTo: dto.timeTo ?? null }),
        ...('busId' in dto && { busId: dto.busId ?? null }),
      },
      include: { driver: true, bus: true },
    });
  }

  async getBuses() {
    return this.prisma.bus.findMany({ orderBy: { name: 'asc' } });
  }

  async createScheduledRide(dto: CreateScheduledRideDto) {
    return this.prisma.scheduledRide.create({
      data: {
        date: new Date(dto.date),
        time: dto.time ?? null,
        timeTo: dto.timeTo ?? null,
        label: dto.label,
        note: dto.note ?? null,
        driverId: dto.driverId ?? null,
        busId: dto.busId ?? null,
      },
      include: { driver: true, bus: true },
    });
  }

  async updateScheduledRide(id: string, dto: UpdateScheduledRideDto) {
    const ride = await this.prisma.scheduledRide.findUnique({ where: { id } });
    if (!ride) throw new NotFoundException('Jazda neexistuje');
    return this.prisma.scheduledRide.update({
      where: { id },
      data: {
        ...(dto.date && { date: new Date(dto.date) }),
        ...(dto.label !== undefined && { label: dto.label }),
        ...('time' in dto && { time: dto.time ?? null }),
        ...('timeTo' in dto && { timeTo: dto.timeTo ?? null }),
        ...(dto.note !== undefined && { note: dto.note }),
        ...('driverId' in dto && { driverId: dto.driverId ?? null }),
        ...('busId' in dto && { busId: dto.busId ?? null }),
      },
      include: { driver: true, bus: true },
    });
  }

  async deleteScheduledRide(id: string) {
    const ride = await this.prisma.scheduledRide.findUnique({ where: { id } });
    if (!ride) throw new NotFoundException('Jazda neexistuje');
    await this.prisma.scheduledRide.delete({ where: { id } });
    return { ok: true };
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
