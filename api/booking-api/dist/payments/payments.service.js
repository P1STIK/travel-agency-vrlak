"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const entities_1 = require("../common/entities");
let PaymentsService = class PaymentsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async handleStripeWebhook(req, signature) {
        const secret = process.env.STRIPE_WEBHOOK_SECRET;
        const apiKey = process.env.STRIPE_SECRET;
        if (!secret || !apiKey) {
            return;
        }
        const stripe = new (require('stripe'))(apiKey, { apiVersion: '2024-06-20' });
        let event;
        try {
            event = stripe.webhooks.constructEvent(req['rawBody'] || req.body, signature, secret);
        }
        catch (err) {
            throw err;
        }
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const bookingId = session.metadata?.bookingId;
                if (bookingId) {
                    await this.prisma.booking.update({
                        where: { id: bookingId },
                        data: { status: entities_1.BookingStatus.PAID, paymentRef: session.id },
                    });
                }
                break;
            }
            default:
                break;
        }
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map