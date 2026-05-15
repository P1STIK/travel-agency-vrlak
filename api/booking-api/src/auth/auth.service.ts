import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(private jwt: JwtService) {}

  async login(username: string, password: string): Promise<{ access_token: string }> {
    const validUsername = process.env.ADMIN_USERNAME;
    const validHash    = process.env.ADMIN_PASSWORD_HASH;

    const ok =
      username === validUsername &&
      !!validHash &&
      (await bcrypt.compare(password, validHash));

    if (!ok) throw new UnauthorizedException('Nesprávne prihlasovacie údaje');

    const token = this.jwt.sign({ sub: 'admin', username });
    return { access_token: token };
  }
}
