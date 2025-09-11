import { PrismaService } from '../prisma/prisma.service';
export declare class PaymentsService {
    private prisma;
    constructor(prisma: PrismaService);
    handleStripeWebhook(req: any, signature?: string): Promise<void>;
}
