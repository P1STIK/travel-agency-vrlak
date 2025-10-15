import { Module } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { ToursService } from './tours.service';
import { ToursController } from './tours.controller';

@Module({
  providers: [PrismaService, ToursService],
  controllers: [ToursController],
})
export class ToursModule {}