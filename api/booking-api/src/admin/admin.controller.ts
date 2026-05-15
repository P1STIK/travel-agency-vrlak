import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminService } from './admin.service';
import { CreateTourDto } from './dto/create-tour.dto';
import { ManualBookingDto } from './dto/manual-booking.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private admin: AdminService) {}

  @Get('tours')
  getTours() {
    return this.admin.getAllTours();
  }

  @Post('tours')
  createTour(@Body() dto: CreateTourDto) {
    return this.admin.createTour(dto);
  }

  @Get('bookings')
  getBookings(@Query('tourSlug') tourSlug?: string) {
    return this.admin.getAllBookings(tourSlug);
  }

  @Post('bookings/manual')
  manualBooking(@Body() dto: ManualBookingDto) {
    return this.admin.createManualBooking(dto);
  }
}
