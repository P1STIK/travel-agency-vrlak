import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { StaffRole } from '@prisma/client';

export class CreateStaffDto {
  @IsEmail() email!: string;
  @IsString() name!: string;
  @MinLength(8) password!: string;
  @IsEnum(StaffRole) role!: StaffRole;
  @IsOptional() @IsString() driverId?: string | null;
}

export class UpdateStaffDto {
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsEnum(StaffRole) role?: StaffRole;
  @IsOptional() @IsString() driverId?: string | null;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @MinLength(8) password?: string;
}

export class UpdateMyPasswordDto {
  @IsString() currentPassword!: string;
  @MinLength(8) newPassword!: string;
}
