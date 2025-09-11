import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { QuoteDto } from './dto/quote.dto';
import { BookingStatus } from '../common/entities';

function randomCode(len = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  quote(dto: QuoteDto) {
    const addons = dto.addons ?? [];
    const addonsTotal = addons.reduce((s, a) => s + (a.priceCents || 0), 0);
    const total = dto.seats * dto.unitPriceCents + addonsTotal;
    return {
      departureId: dto.departureId,
      seats: dto.seats,
      unitPriceCents: dto.unitPriceCents,
      addons,
      totalCents: total,
      currency: process.env.CURRENCY || 'EUR',
      breakdown: {
        baseCents: dto.seats * dto.unitPriceCents,
        addonsCents: addonsTotal,
      },
    };
  }

  async create(dto: CreateBookingDto) {
    const quote = this.quote({
      departureId: dto.departureId,
      seats: dto.seats,
      unitPriceCents: dto.unitPriceCents,
      addons: dto.addons,
    });

    const created = await this.prisma.booking.create({
      data: {
        code: randomCode(8),
        departureId: dto.departureId,
        tourSlug: dto.tourSlug,
        email: dto.email,
        seats: dto.seats,
        unitPriceCents: dto.unitPriceCents,
        totalAmount: quote.totalCents,
        currency: quote.currency,
        status: BookingStatus.PENDING,
        passengers: {
          create: dto.passengers.map(p => ({ firstName: p.firstName, lastName: p.lastName })),
        },
      },
      include: { passengers: true },
    });

    return {
      bookingId: created.id,
      code: created.code,
      totalCents: created.totalAmount,
      currency: created.currency,
      status: created.status,
    };
  }

  async createCheckoutSession(bookingId: string, returnUrl: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) { throw new Error('Booking not found'); }

    // Optional Stripe integration (enabled if STRIPE_SECRET is set)
    const secret = process.env.STRIPE_SECRET;
    if (secret) {
      const stripe = new (require('stripe'))(secret, { apiVersion: '2024-06-20' });
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        success_url: `${returnUrl}?status=success&bookingId=${bookingId}`,
        cancel_url: `${returnUrl}?status=cancel&bookingId=${bookingId}`,
        currency: (booking.currency || 'EUR').toLowerCase(),
        line_items: [{
          quantity: 1,
          price_data: {
            currency: (booking.currency || 'EUR').toLowerCase(),
            product_data: {
              name: `Rezervácia – ${booking.tourSlug || booking.departureId}`,
              description: `Počet osôb: ${booking.seats}`,
            },
            unit_amount: booking.totalAmount,
          },
        }],
        metadata: { bookingId },
      });
      return { checkoutUrl: session.url, provider: 'stripe' };
    }

    // Fallback (dev/demo): falošná URL
    return { checkoutUrl: `${returnUrl}?status=simulated&bookingId=${bookingId}`, provider: 'demo' };
  }

  async findOne(id: string){
    return this.prisma.booking.findUnique({
      where: { id },
      include: { passengers: true },
    });
  }
}
