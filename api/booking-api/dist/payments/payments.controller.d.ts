import { PaymentsService } from './payments.service';
import { Request, Response } from 'express';
export declare class PaymentsController {
    private readonly svc;
    constructor(svc: PaymentsService);
    webhook(req: Request, res: Response, signature?: string): Promise<void>;
}
