import { Body, Controller, Delete, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { CustomerAuthGuard } from '../auth/customer-jwt-auth.guard';
import { CustomersService } from './customers.service';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';

@Controller('me')
@UseGuards(CustomerAuthGuard)
export class MeController {
  constructor(private customers: CustomersService) {}

  @Get()
  getMe(@Req() req: any) {
    return this.customers.getMe(req.user.customerId);
  }

  @Patch()
  updateMe(@Req() req: any, @Body() dto: UpdateCustomerDto) {
    return this.customers.updateMe(req.user.customerId, dto);
  }

  @Patch('password')
  updateMyPassword(@Req() req: any, @Body() dto: UpdatePasswordDto) {
    return this.customers.updateMyPassword(req.user.customerId, dto);
  }

  @Get('bookings')
  getMyBookings(@Req() req: any) {
    return this.customers.getMyBookings(req.user.customerId);
  }

  @Delete()
  deleteMe(@Req() req: any, @Body() dto: DeleteAccountDto) {
    return this.customers.deleteMe(req.user.customerId, dto.password);
  }
}
