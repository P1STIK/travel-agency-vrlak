import { Controller, Headers, HttpCode, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';

type RawRequest = Request & { rawBody?: Buffer };

@Controller('payments')
export class PaymentsController {
  constructor(private prisma: PrismaService) {}

  @Post('webhook')
  @HttpCode(200) // Stripe chce 2xx rýchlo
  async webhook(
    @Req() req: RawRequest,
    @Res() res: Response,
    @Headers('stripe-signature') signature: string,
  ) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const apiKey        = process.env.STRIPE_SECRET;

    // ✳️ diagnostika – uvidíš hneď, čo chýba
    console.log('[webhook] has apiKey?', !!apiKey, 'has whsec?', !!webhookSecret);
    console.log('[webhook] signature header present?', !!signature);
    console.log('[webhook] isBuffer(req.body)?', Buffer.isBuffer((req as any).body));

    if (!webhookSecret || !apiKey) return res.send({ ok: true });

    const stripe = new (require('stripe'))(apiKey, { apiVersion: '2024-06-20' });

    let event;
    try {
      // ✅ použij presne tie isté bajty
      const payload: Buffer =
        (req as any).rawBody ??
        (Buffer.isBuffer((req as any).body) ? (req as any).body : Buffer.from(JSON.stringify(req.body)));

      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      console.log('[webhook] verified:', event.type);
    } catch (err: any) {
      console.error('[webhook] verify FAILED:', err?.message);
      return res.status(400).send(`Webhook error: ${err?.message}`);
    }

    try {
      if (event.type === 'checkout.session.completed') {
        const session: any = event.data.object;
        const bookingId    = session.metadata?.bookingId;
        console.log('[webhook] bookingId:', bookingId);
        if (bookingId) {
          await this.prisma.booking.update({
            where: { id: bookingId },
            data:  { status: 'PAID' },
          });
        }
      }
    } catch (e) {
      console.error('[webhook] handler error:', e);
      return res.status(500).send('handler error');
    }

    return res.send({ received: true });
  }
}