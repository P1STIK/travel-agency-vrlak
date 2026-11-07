import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { StaffRole } from '@prisma/client';
import { BookingStatus } from '../common/entities';
import { PrismaService } from '../prisma/prisma.service';
import { activeStatuses, randomCode, withBookedSeats } from '../common/utils';
import { CreateTourDto } from './dto/create-tour.dto';
import { ManualBookingDto } from './dto/manual-booking.dto';
import { AssignDriverDto, CreateScheduledRideDto, UpdateScheduledRideDto } from './dto/scheduled-ride.dto';
import { CreateStaffDto, UpdateMyPasswordDto, UpdateStaffDto } from './dto/staff.dto';

const inactiveStatuses = new Set<string>([BookingStatus.CANCELLED, BookingStatus.REFUNDED]);

const bookingsInclude = {
  where: { status: { notIn: activeStatuses } },
  select: { seats: true },
};

export interface Actor {
  staffId: string;
  role: StaffRole;
  driverId: string | null;
}

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  private toStaffDto(staff: {
    id: string;
    email: string;
    name: string;
    role: StaffRole;
    driverId: string | null;
    driver: { id: string; name: string; color: string } | null;
    active: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
  }) {
    return {
      id: staff.id,
      email: staff.email,
      name: staff.name,
      role: staff.role,
      driverId: staff.driverId,
      driver: staff.driver,
      active: staff.active,
      lastLoginAt: staff.lastLoginAt ? staff.lastLoginAt.toISOString() : null,
      createdAt: staff.createdAt.toISOString(),
    };
  }

  private assertCanWriteRide(actor: Actor, currentDriverId: string | null, nextDriverId?: string | null) {
    if (actor.role === StaffRole.ADMIN) return;
    if (!actor.driverId) throw new ForbiddenException('Môžete upravovať iba svoje jazdy');
    if (currentDriverId !== actor.driverId) throw new ForbiddenException('Môžete upravovať iba svoje jazdy');
    if (nextDriverId !== undefined && nextDriverId !== actor.driverId) {
      throw new ForbiddenException('Môžete upravovať iba svoje jazdy');
    }
  }

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

    for (const d of dto.departures ?? []) {
      if (!d.returnDate) continue;
      const departureDate = new Date(d.date);
      const returnDate = new Date(d.returnDate);
      if (isNaN(returnDate.getTime())) {
        throw new BadRequestException('Neplatný dátum návratu');
      }
      if (returnDate < departureDate) {
        throw new BadRequestException('Dátum návratu nemôže byť skôr ako dátum odchodu');
      }
    }

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
                returnDate: d.returnDate ? new Date(d.returnDate) : null,
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

  async assignDepartureDriver(id: string, dto: AssignDriverDto, actor: Actor) {
    const dep = await this.prisma.departure.findUnique({ where: { id } });
    if (!dep) throw new NotFoundException('Odchod neexistuje');
    this.assertCanWriteRide(actor, dep.driverId, dto.driverId ?? null);
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

  async createScheduledRide(dto: CreateScheduledRideDto, actor: Actor) {
    if (actor.role !== StaffRole.ADMIN) {
      if (!actor.driverId || dto.driverId !== actor.driverId) {
        throw new ForbiddenException('Môžete upravovať iba svoje jazdy');
      }
    }
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

  async updateScheduledRide(id: string, dto: UpdateScheduledRideDto, actor: Actor) {
    const ride = await this.prisma.scheduledRide.findUnique({ where: { id } });
    if (!ride) throw new NotFoundException('Jazda neexistuje');
    this.assertCanWriteRide(actor, ride.driverId, 'driverId' in dto ? dto.driverId ?? null : undefined);
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

  async deleteScheduledRide(id: string, actor: Actor) {
    const ride = await this.prisma.scheduledRide.findUnique({ where: { id } });
    if (!ride) throw new NotFoundException('Jazda neexistuje');
    this.assertCanWriteRide(actor, ride.driverId);
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

  async getMe(actor: Actor) {
    const staff = await this.prisma.staffUser.findUnique({ where: { id: actor.staffId } });
    if (!staff) throw new NotFoundException('Používateľ neexistuje');
    return { id: staff.id, name: staff.name, email: staff.email, role: staff.role, driverId: staff.driverId };
  }

  async updateMyPassword(actor: Actor, dto: UpdateMyPasswordDto) {
    const staff = await this.prisma.staffUser.findUnique({ where: { id: actor.staffId } });
    if (!staff) throw new NotFoundException('Používateľ neexistuje');

    const ok = await bcrypt.compare(dto.currentPassword, staff.passwordHash);
    if (!ok) throw new BadRequestException('Nesprávne aktuálne heslo');

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.staffUser.update({ where: { id: staff.id }, data: { passwordHash } });
    return { ok: true };
  }

  async getStaff() {
    const staff = await this.prisma.staffUser.findMany({
      orderBy: { name: 'asc' },
      include: { driver: { select: { id: true, name: true, color: true } } },
    });
    return staff.map(s => this.toStaffDto(s));
  }

  private async assertDriverAvailable(driverId: string | null | undefined, excludeStaffId?: string) {
    if (!driverId) return;
    const driver = await this.prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) throw new NotFoundException('Vodič neexistuje');

    const linked = await this.prisma.staffUser.findUnique({ where: { driverId } });
    if (linked && linked.id !== excludeStaffId) {
      throw new ConflictException('Vodič je už priradený inému používateľovi');
    }
  }

  async createStaff(dto: CreateStaffDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.staffUser.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Používateľ s týmto e-mailom už existuje');

    await this.assertDriverAvailable(dto.driverId);

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const staff = await this.prisma.staffUser.create({
      data: {
        email,
        name: dto.name,
        passwordHash,
        role: dto.role,
        driverId: dto.driverId ?? null,
      },
      include: { driver: { select: { id: true, name: true, color: true } } },
    });
    return this.toStaffDto(staff);
  }

  async updateStaff(id: string, dto: UpdateStaffDto) {
    const existing = await this.prisma.staffUser.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Používateľ neexistuje');

    if (dto.email !== undefined) {
      const email = dto.email.trim().toLowerCase();
      const other = await this.prisma.staffUser.findUnique({ where: { email } });
      if (other && other.id !== id) throw new ConflictException('Používateľ s týmto e-mailom už existuje');
    }

    if (dto.driverId !== undefined) {
      await this.assertDriverAvailable(dto.driverId, id);
    }

    const nextRole = dto.role ?? existing.role;
    const nextActive = dto.active ?? existing.active;
    if (existing.role === StaffRole.ADMIN && existing.active && (nextRole !== StaffRole.ADMIN || !nextActive)) {
      const activeAdmins = await this.prisma.staffUser.count({
        where: { role: StaffRole.ADMIN, active: true, id: { not: id } },
      });
      if (activeAdmins === 0) {
        throw new BadRequestException('Musí zostať aspoň jeden aktívny administrátor');
      }
    }

    const passwordHash = dto.password ? await bcrypt.hash(dto.password, 10) : undefined;

    const staff = await this.prisma.staffUser.update({
      where: { id },
      data: {
        ...(dto.email !== undefined && { email: dto.email.trim().toLowerCase() }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.role !== undefined && { role: dto.role }),
        ...(dto.driverId !== undefined && { driverId: dto.driverId }),
        ...(dto.active !== undefined && { active: dto.active }),
        ...(passwordHash !== undefined && { passwordHash }),
      },
      include: { driver: { select: { id: true, name: true, color: true } } },
    });
    return this.toStaffDto(staff);
  }
}
