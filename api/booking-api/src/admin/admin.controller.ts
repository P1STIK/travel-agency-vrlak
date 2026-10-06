import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminService } from './admin.service';
import { CreateTourDto } from './dto/create-tour.dto';
import { ManualBookingDto } from './dto/manual-booking.dto';
import { AssignDriverDto, CreateScheduledRideDto, UpdateScheduledRideDto } from './dto/scheduled-ride.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private admin: AdminService) {}

  @Get('tours')
  getTours() {
    return this.admin.getAllTours();
  }

  @Get('tours/:slug')
  getTourDetail(@Param('slug') slug: string) {
    return this.admin.getTourDetail(slug);
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

  @Get('drivers')
  getDrivers() {
    return this.admin.getDrivers();
  }

  @Get('buses')
  getBuses() {
    return this.admin.getBuses();
  }

  @Get('calendar')
  getCalendar(@Query('from') from: string, @Query('to') to: string) {
    return this.admin.getCalendar(from, to);
  }

  @Patch('departures/:id/driver')
  assignDepartureDriver(@Param('id') id: string, @Body() dto: AssignDriverDto) {
    return this.admin.assignDepartureDriver(id, dto);
  }

  @Post('scheduled-rides')
  createScheduledRide(@Body() dto: CreateScheduledRideDto) {
    return this.admin.createScheduledRide(dto);
  }

  @Patch('scheduled-rides/:id')
  updateScheduledRide(@Param('id') id: string, @Body() dto: UpdateScheduledRideDto) {
    return this.admin.updateScheduledRide(id, dto);
  }

  @Delete('scheduled-rides/:id')
  deleteScheduledRide(@Param('id') id: string) {
    return this.admin.deleteScheduledRide(id);
  }
}
