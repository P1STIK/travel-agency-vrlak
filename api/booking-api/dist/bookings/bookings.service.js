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
exports.BookingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const entities_1 = require("../common/entities");
function randomCode(len = 8) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}
let BookingsService = class BookingsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    quote(dto) {
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
    async create(dto) {
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
                status: entities_1.BookingStatus.PENDING,
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
    async createCheckoutSession(bookingId, returnUrl) {
        const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
        if (!booking) {
            throw new Error('Booking not found');
        }
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
        return { checkoutUrl: `${returnUrl}?status=simulated&bookingId=${bookingId}`, provider: 'demo' };
    }
    async findOne(id) {
        return this.prisma.booking.findUnique({
            where: { id },
            include: { passengers: true },
        });
    }
};
exports.BookingsService = BookingsService;
exports.BookingsService = BookingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BookingsService);
//# sourceMappingURL=bookings.service.js.map