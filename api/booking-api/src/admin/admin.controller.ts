import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { StaffRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AdminService } from './admin.service';
import { CreateTourDto } from './dto/create-tour.dto';
import { ManualBookingDto } from './dto/manual-booking.dto';
import { AssignDriverDto, CreateScheduledRideDto, UpdateScheduledRideDto } from './dto/scheduled-ride.dto';
import { CreateStaffDto, UpdateMyPasswordDto, UpdateStaffDto } from './dto/staff.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(StaffRole.ADMIN)
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
  @Roles(StaffRole.ADMIN, StaffRole.DRIVER)
  getDrivers() {
    return this.admin.getDrivers();
  }

  @Get('buses')
  @Roles(StaffRole.ADMIN, StaffRole.DRIVER)
  getBuses() {
    return this.admin.getBuses();
  }

  @Get('calendar')
  @Roles(StaffRole.ADMIN, StaffRole.DRIVER)
  getCalendar(@Query('from') from: string, @Query('to') to: string) {
    return this.admin.getCalendar(from, to);
  }

  @Patch('departures/:id/driver')
  @Roles(StaffRole.ADMIN, StaffRole.DRIVER)
  assignDepartureDriver(@Param('id') id: string, @Body() dto: AssignDriverDto, @Req() req: any) {
    return this.admin.assignDepartureDriver(id, dto, req.user);
  }

  @Post('scheduled-rides')
  @Roles(StaffRole.ADMIN, StaffRole.DRIVER)
  createScheduledRide(@Body() dto: CreateScheduledRideDto, @Req() req: any) {
    return this.admin.createScheduledRide(dto, req.user);
  }

  @Patch('scheduled-rides/:id')
  @Roles(StaffRole.ADMIN, StaffRole.DRIVER)
  updateScheduledRide(@Param('id') id: string, @Body() dto: UpdateScheduledRideDto, @Req() req: any) {
    return this.admin.updateScheduledRide(id, dto, req.user);
  }

  @Delete('scheduled-rides/:id')
  @Roles(StaffRole.ADMIN, StaffRole.DRIVER)
  deleteScheduledRide(@Param('id') id: string, @Req() req: any) {
    return this.admin.deleteScheduledRide(id, req.user);
  }

  @Get('me')
  @Roles(StaffRole.ADMIN, StaffRole.DRIVER)
  getMe(@Req() req: any) {
    return this.admin.getMe(req.user);
  }

  @Patch('me/password')
  @Roles(StaffRole.ADMIN, StaffRole.DRIVER)
  updateMyPassword(@Body() dto: UpdateMyPasswordDto, @Req() req: any) {
    return this.admin.updateMyPassword(req.user, dto);
  }

  @Get('staff')
  getStaff() {
    return this.admin.getStaff();
  }

  @Post('staff')
  createStaff(@Body() dto: CreateStaffDto) {
    return this.admin.createStaff(dto);
  }

  @Patch('staff/:id')
  updateStaff(@Param('id') id: string, @Body() dto: UpdateStaffDto) {
    return this.admin.updateStaff(id, dto);
  }
}
