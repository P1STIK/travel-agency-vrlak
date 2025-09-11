export declare class QuoteDto {
    departureId: string;
    seats: number;
    unitPriceCents: number;
    addons?: {
        code: string;
        priceCents: number;
    }[];
}
