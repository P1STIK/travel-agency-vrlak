import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ToursService } from './tours.service';

@Controller('tours')
export class ToursController {
  constructor(private tours: ToursService) {}

  @Get()
  findAll() {
    return this.tours.getAll();
  }

  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    const tour = await this.tours.getBySlug(slug);
    if (!tour) throw new NotFoundException('Tour not found');
    return tour;
  }
}
