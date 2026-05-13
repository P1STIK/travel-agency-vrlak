import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus } from '../common/entities';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async handleStripeWebhook(rawBody: Buffer, signature: string) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const apiKey = process.env.STRIPE_SECRET;

    if (!webhookSecret || !apiKey) return;

    const stripe = new (require('stripe'))(apiKey, { apiVersion: '2024-06-20' });

    let event: any;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
      throw new BadRequestException(`Webhook verification failed: ${err?.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const bookingId = session.metadata?.bookingId as string | undefined;
      if (bookingId) {
        try {
          await this.prisma.booking.update({
            where: { id: bookingId },
            data: { status: BookingStatus.PAID, paymentRef: session.id },
          });
        } catch {
          throw new InternalServerErrorException('Failed to update booking');
        }
      }
    }
  }
}
