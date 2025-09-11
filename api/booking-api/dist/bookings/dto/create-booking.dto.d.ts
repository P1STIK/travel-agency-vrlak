declare class PassengerDto {
    firstName: string;
    lastName: string;
}
export declare class CreateBookingDto {
    departureId: string;
    tourSlug: string;
    email: string;
    seats: number;
    unitPriceCents: number;
    addons?: {
        code: string;
        priceCents: number;
    }[];
    passengers: PassengerDto[];
}
export {};
