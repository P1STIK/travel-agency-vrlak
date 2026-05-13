import { Controller, Headers, HttpCode, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { PaymentsService } from './payments.service';

type RawRequest = Request & { rawBody?: Buffer };

@Controller('payments')
export class PaymentsController {
  constructor(private payments: PaymentsService) {}

  @Post('webhook')
  @HttpCode(200)
  async webhook(
    @Req() req: RawRequest,
    @Res() res: Response,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody: Buffer =
      req.rawBody ??
      (Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body)));

    try {
      await this.payments.handleStripeWebhook(rawBody, signature);
    } catch (err: any) {
      return res.status(err?.status ?? 400).send(err?.message ?? 'Webhook error');
    }

    return res.send({ received: true });
  }
}
