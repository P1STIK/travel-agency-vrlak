import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { QuoteDto } from './dto/quote.dto';
import { CreateBookingDto } from './dto/create-booking.dto';

@Controller('booking')
export class BookingsController {
  constructor(private readonly svc: BookingsService) {}

  @Post('quote')
  quote(@Body() dto: QuoteDto) {
    return this.svc.quote(dto);
  }

  @Post()
  create(@Body() dto: CreateBookingDto) {
    return this.svc.create(dto);
  }

  @Post('checkout/session')
  checkout(@Body() body: { bookingId: string; returnUrl: string }) {
    return this.svc.createCheckoutSession(body.bookingId, body.returnUrl);
  }

  @Get (':id')
    findOne(@Param('id') id: string){
    return this.svc.findOne(id);
  }
}
