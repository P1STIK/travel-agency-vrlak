import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsEmail, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

class PassengerDto {
  @IsString() firstName!: string;
  @IsString() lastName!: string;
}

export class ManualBookingDto {
  @IsString() departureId!: string;
  @IsString() tourSlug!: string;

  @IsEmail() email!: string;

  @IsInt() @Min(1) seats!: number;

  @IsOptional() @IsInt() @Min(0) unitPriceCents?: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PassengerDto)
  passengers!: PassengerDto[];
}
