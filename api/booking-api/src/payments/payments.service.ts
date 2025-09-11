import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus } from '../common/entities';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async handleStripeWebhook(req: any, signature?: string) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    const apiKey = process.env.STRIPE_SECRET;
    if (!secret || !apiKey) {
      // In dev without Stripe, just ignore
      return;
    }
    const stripe = new (require('stripe'))(apiKey, { apiVersion: '2024-06-20' });
    let event;
    try {
      event = stripe.webhooks.constructEvent(req['rawBody'] || req.body, signature, secret);
    } catch (err) {
      throw err;
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const bookingId = session.metadata?.bookingId as string | undefined;
        if (bookingId) {
          await this.prisma.booking.update({
            where: { id: bookingId },
            data: { status: BookingStatus.PAID, paymentRef: session.id },
          });
        }
        break;
      }
      default:
        break;
    }
  }
}
