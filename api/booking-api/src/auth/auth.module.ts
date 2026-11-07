import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';
import { CustomerJwtStrategy } from './customer-jwt.strategy';
import { CustomerAuthGuard } from './customer-jwt-auth.guard';
import { OptionalCustomerAuthGuard } from './optional-customer-jwt-auth.guard';
import { RolesGuard } from './roles.guard';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET!,
        signOptions: { expiresIn: '8h' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    CustomerJwtStrategy,
    CustomerAuthGuard,
    OptionalCustomerAuthGuard,
    RolesGuard,
  ],
  exports: [JwtAuthGuard, RolesGuard, CustomerAuthGuard, OptionalCustomerAuthGuard],
})
export class AuthModule {}
