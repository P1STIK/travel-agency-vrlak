import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MeController } from './me.controller';
import { CustomersService } from './customers.service';

@Module({
  imports: [AuthModule],
  controllers: [MeController],
  providers: [CustomersService],
})
export class CustomersModule {}
