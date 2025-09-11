import { BookingsService } from './bookings.service';
import { QuoteDto } from './dto/quote.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
export declare class BookingsController {
    private readonly svc;
    constructor(svc: BookingsService);
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
    checkout(body: {
        bookingId: string;
        returnUrl: string;
    }): Promise<{
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
