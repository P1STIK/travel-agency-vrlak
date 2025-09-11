import { Type } from 'class-transformer';
import { IsEmail, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

class PassengerDto {
  @IsString() firstName!: string;
  @IsString() lastName!: string;
}

export class CreateBookingDto {
  @IsString()
  departureId!: string;

  @IsString()
  tourSlug!: string;

  @IsEmail()
  email!: string;

  @IsInt()
  @Min(1)
  seats!: number;

  @IsInt()
  @Min(0)
  unitPriceCents!: number;

  @IsOptional()
  addons?: { code: string; priceCents: number }[];

  @ValidateNested({ each: true })
  @Type(() => PassengerDto)
  passengers!: PassengerDto[];
}
