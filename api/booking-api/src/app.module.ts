import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BookingsModule } from './bookings/bookings.module';
import { PaymentsModule } from './payments/payments.module';
import { PrismaModule } from './prisma/prisma.module';
import { ToursModule } from './tours/tours.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    BookingsModule,
    PaymentsModule,
    ToursModule
  ],
})
export class AppModule {}
