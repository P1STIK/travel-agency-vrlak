import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { StaffRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

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
}
