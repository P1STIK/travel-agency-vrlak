import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class QuoteDto {
  @IsString()
  departureId!: string;

  @IsInt()
  @Min(1)
  seats!: number;

  // MVP: FE dodá jednotkovú cenu v centoch (násobí sa sedadlami)
  @IsInt()
  @Min(0)
  unitPriceCents!: number;

  @IsOptional()
  addons?: { code: string; priceCents: number }[];
}
