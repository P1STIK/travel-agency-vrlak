import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { toCustomerProfile } from '../common/utils';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async getMe(customerId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: customerId } });
    if (!user) throw new NotFoundException('Používateľ neexistuje');
    return toCustomerProfile(user);
  }

  async updateMe(customerId: string, dto: UpdateCustomerDto) {
    const existing = await this.prisma.user.findUnique({ where: { id: customerId } });
    if (!existing) throw new NotFoundException('Používateľ neexistuje');

    const user = await this.prisma.user.update({
      where: { id: customerId },
      data: {
        ...(dto.firstName !== undefined && { firstName: dto.firstName }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName }),
        ...(dto.phone !== undefined && { phone: dto.phone || null }),
        ...(dto.street !== undefined && { street: dto.street || null }),
        ...(dto.city !== undefined && { city: dto.city || null }),
        ...(dto.zip !== undefined && { zip: dto.zip || null }),
      },
    });
    return toCustomerProfile(user);
  }

  async updateMyPassword(customerId: string, dto: UpdatePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: customerId } });
    if (!user) throw new NotFoundException('Používateľ neexistuje');

    const ok = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!ok) throw new BadRequestException('Aktuálne heslo je nesprávne');

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({ where: { id: customerId }, data: { passwordHash } });
    return { ok: true };
  }

  async getMyBookings(customerId: string) {
    const bookings = await this.prisma.booking.findMany({
      where: { userId: customerId },
      orderBy: { createdAt: 'desc' },
      include: {
        passengers: { select: { firstName: true, lastName: true } },
        departure: {
          select: {
            date: true,
            returnDate: true,
            time: true,
            tour: { select: { slug: true, title: true } },
          },
        },
      },
    });

    return bookings.map(b => ({
      id: b.id,
      code: b.code,
      status: b.status,
      seats: b.seats,
      totalAmount: b.totalAmount,
      currency: b.currency,
      createdAt: b.createdAt.toISOString(),
      tour: b.departure?.tour ? { slug: b.departure.tour.slug, title: b.departure.tour.title } : null,
      departure: b.departure
        ? {
            date: b.departure.date.toISOString(),
            returnDate: b.departure.returnDate ? b.departure.returnDate.toISOString() : null,
            time: b.departure.time ?? null,
          }
        : null,
      passengers: b.passengers.map(p => ({ firstName: p.firstName, lastName: p.lastName })),
    }));
  }

  async deleteMe(customerId: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { id: customerId } });
    if (!user) throw new NotFoundException('Používateľ neexistuje');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new BadRequestException('Heslo je nesprávne');

    await this.prisma.user.delete({ where: { id: customerId } });
    return { ok: true };
  }
}
