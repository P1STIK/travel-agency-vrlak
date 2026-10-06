import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { BookingsService } from './bookings.service';
import { QuoteDto } from './dto/quote.dto';
import { CreateBookingDto } from './dto/create-booking.dto';

const INSURANCE_UPLOAD_DIR = join(process.cwd(), 'uploads', 'insurance');
const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

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

  @Post(':bookingId/passengers/:passengerId/insurance-document')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (_req, _file, cb) => {
        if (!existsSync(INSURANCE_UPLOAD_DIR)) mkdirSync(INSURANCE_UPLOAD_DIR, { recursive: true });
        cb(null, INSURANCE_UPLOAD_DIR);
      },
      filename: (_req, file, cb) => {
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`);
      },
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!ALLOWED_MIME.includes(file.mimetype)) {
        return cb(new BadRequestException('Nepovolený typ súboru (povolené: PDF, JPG, PNG, WEBP)'), false);
      }
      cb(null, true);
    },
  }))
  async uploadInsuranceDocument(
    @Param('bookingId') bookingId: string,
    @Param('passengerId') passengerId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Chýba súbor');
    const relativePath = `/uploads/insurance/${file.filename}`;
    return this.svc.uploadInsuranceDocument(bookingId, passengerId, relativePath);
  }
}
