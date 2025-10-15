import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';

@Injectable()
export class ToursService {
  constructor(private prisma: PrismaService) {}

  getAll() {
    return this.prisma.tour.findMany({
      orderBy: { createdAt: 'desc' },
      include: { departures: { orderBy: { date: 'asc' } } },
    });
  }

  getBySlug(slug: string) {
    return this.prisma.tour.findUnique({
      where: { slug },
      include: { departures: { orderBy: { date: 'asc' } } },
    });
  }
}