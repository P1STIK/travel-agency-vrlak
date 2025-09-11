import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { QuoteDto } from './dto/quote.dto';
export declare class BookingsService {
    private prisma;
    constructor(prisma: PrismaService);
    quote(dto: QuoteDto): {
        departureId: string;
        seats: number;
        unitPriceCents: number;
        addons: {
            code: string;
            priceCents: number;
        }[];
        totalCents: number;
        currency: string;
        breakdown: {
            baseCents: number;
            addonsCents: number;
        };
    };
    create(dto: CreateBookingDto): Promise<{
        bookingId: string;
        code: string;
        totalCents: number;
        currency: string;
        status: import(".prisma/client").$Enums.BookingStatus;
    }>;
    createCheckoutSession(bookingId: string, returnUrl: string): Promise<{
        checkoutUrl: any;
        provider: string;
    }>;
    findOne(id: string): Promise<{
        passengers: {
            id: string;
            firstName: string;
            lastName: string;
            bookingId: string;
        }[];
    } & {
        id: string;
        code: string;
        departureId: string;
        tourSlug: string | null;
        email: string;
        seats: number;
        unitPriceCents: number;
        totalAmount: number;
        currency: string;
        status: import(".prisma/client").$Enums.BookingStatus;
        paymentRef: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
