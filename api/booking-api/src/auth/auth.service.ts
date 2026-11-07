import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { StaffRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CustomerProfile, toCustomerProfile } from '../common/utils';
import { RegisterCustomerDto } from './dto/register-customer.dto';

@Injectable()
export class AuthService {
  constructor(private jwt: JwtService, private prisma: PrismaService) {}

  async staffLogin(
    email: string,
    password: string,
  ): Promise<{
    access_token: string;
    staff: { id: string; name: string; email: string; role: StaffRole; driverId: string | null };
  }> {
    const normalizedEmail = email.trim().toLowerCase();
    const staff = await this.prisma.staffUser.findUnique({ where: { email: normalizedEmail } });

    if (!staff || !staff.active || !(await bcrypt.compare(password, staff.passwordHash))) {
      throw new UnauthorizedException('Nesprávne prihlasovacie údaje');
    }

    await this.prisma.staffUser.update({ where: { id: staff.id }, data: { lastLoginAt: new Date() } });

    const token = this.jwt.sign({
      sub: staff.id,
      kind: 'staff',
      role: staff.role,
      driverId: staff.driverId,
    });

    return {
      access_token: token,
      staff: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        driverId: staff.driverId,
      },
    };
  }

  async registerCustomer(dto: RegisterCustomerDto): Promise<{ access_token: string; customer: CustomerProfile }> {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Účet s týmto e-mailom už existuje');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone || null,
        street: dto.street || null,
        city: dto.city || null,
        zip: dto.zip || null,
      },
    });

    const access_token = this.jwt.sign({ sub: user.id, kind: 'customer' }, { expiresIn: '30d' });
    return { access_token, customer: toCustomerProfile(user) };
  }

  async customerLogin(email: string, password: string): Promise<{ access_token: string; customer: CustomerProfile }> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Nesprávne prihlasovacie údaje');
    }

    const access_token = this.jwt.sign({ sub: user.id, kind: 'customer' }, { expiresIn: '30d' });
    return { access_token, customer: toCustomerProfile(user) };
  }
}
