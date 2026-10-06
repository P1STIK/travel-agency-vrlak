import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateScheduledRideDto {
  @IsDateString()
  date: string;

  @IsOptional() @IsString() time?: string;
  @IsOptional() @IsString() timeTo?: string;

  @IsString()
  label: string;

  @IsOptional() @IsString() note?: string;
  @IsOptional() @IsString() driverId?: string;
  @IsOptional() @IsString() busId?: string;
}

export class UpdateScheduledRideDto {
  @IsOptional() @IsDateString() date?: string;
  @IsOptional() @IsString() time?: string | null;
  @IsOptional() @IsString() timeTo?: string | null;
  @IsOptional() @IsString() label?: string;
  @IsOptional() @IsString() note?: string;
  @IsOptional() @IsString() driverId?: string | null;
  @IsOptional() @IsString() busId?: string | null;
}

export class AssignDriverDto {
  @IsOptional() @IsString() driverId?: string | null;
  @IsOptional() @IsString() time?: string | null;
  @IsOptional() @IsString() timeTo?: string | null;
  @IsOptional() @IsString() busId?: string | null;
}
