import { Body, Controller, Headers, Post, Req, Res } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Request, Response } from 'express';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly svc: PaymentsService) {}

  @Post('webhook')
  async webhook(@Req() req: Request, @Res() res: Response, @Headers('stripe-signature') signature?: string) {
    await this.svc.handleStripeWebhook(req, signature);
    res.status(200).send({ ok: true });
  }
}
