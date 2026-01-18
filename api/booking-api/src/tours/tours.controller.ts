import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ToursService } from './tours.service';

@Controller('tours')
export class ToursController {
  constructor(private readonly tours: ToursService) {}

  @Get()
  findAll() {
    return this.tours.findAll();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.tours.findBySlug(slug);
  }
}
