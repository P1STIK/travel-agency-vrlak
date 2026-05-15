import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

class DepartureDto {
  @IsString() date!: string;
  @IsInt() @Min(0) unitPriceCents!: number;
  @IsInt() @Min(1) capacity!: number;
}

export class CreateTourDto {
  @IsString() slug!: string;
  @IsString() title!: string;

  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() teaser?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsString() heroImage?: string;
  @IsOptional() @IsString() thumbImage?: string;
  @IsOptional() @IsString() duration?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DepartureDto)
  departures?: DepartureDto[];
}
