import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { StaffRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface StaffJwtPayload {
  sub: string;
  kind: string;
  role: StaffRole;
  driverId: string | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  async validate(payload: StaffJwtPayload) {
    if (payload.kind !== 'staff') throw new UnauthorizedException();

    const staff = await this.prisma.staffUser.findUnique({ where: { id: payload.sub } });
    if (!staff || !staff.active) throw new UnauthorizedException();

    return { staffId: staff.id, role: staff.role, driverId: staff.driverId };
  }
}
