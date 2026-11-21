import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize, IsArray, IsBoolean, IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString,
  Matches, Max, MaxLength, Min, MinLength, ValidateIf,
} from 'class-validator';

const PHONE = /^(\+?91)?[6-9]\d{9}$/;
const SUBDOMAIN = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/;
const DOMAIN = /^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;

export class CreatePlanDto {
  @ApiProperty() @IsString() @MinLength(2) @MaxLength(40) name: string;
  @ApiProperty() @IsNumber() @Min(0) monthlyPrice: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(300) description?: string;
}

export class UpdatePlanDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MinLength(2) @MaxLength(40) name?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() @Min(0) monthlyPrice?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(300) description?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() isActive?: boolean;
}

/** Content an owner may edit on their own website. */
export class WebsiteContentDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(120) tagline?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(1500) about?: string;
  @ApiProperty({ required: false, type: [String] })
  @IsOptional() @IsArray() @ArrayMaxSize(8) @IsString({ each: true }) @MaxLength(80, { each: true })
  usps?: string[];
  @ApiProperty({ required: false })
  @IsOptional() @ValidateIf((_, v) => v !== '' && v !== null) @Matches(PHONE, { message: 'Enter a valid 10-digit mobile number' })
  whatsappNumber?: string | null;
}

/** Everything the system admin may change. */
export class AdminUpdateWebsiteDto extends WebsiteContentDto {
  @ApiProperty({ required: false, enum: ['DRAFT', 'ACTIVE', 'SUSPENDED'] })
  @IsOptional() @IsIn(['DRAFT', 'ACTIVE', 'SUSPENDED']) status?: 'DRAFT' | 'ACTIVE' | 'SUSPENDED';
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(200) suspendedReason?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() planId?: string | null;
  @ApiProperty({ required: false })
  @IsOptional() @Matches(SUBDOMAIN, { message: 'Subdomain: 3-40 lowercase letters, numbers or hyphens' }) subdomain?: string;
  @ApiProperty({ required: false })
  @IsOptional() @ValidateIf((_, v) => v !== '' && v !== null) @Matches(DOMAIN, { message: 'Enter a domain like www.example.com' })
  customDomain?: string | null;
}

export class CreateWebsiteDto {
  @ApiProperty() @IsString() farmhouseId: string;
  @ApiProperty({ required: false }) @IsOptional() @Matches(SUBDOMAIN) subdomain?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() planId?: string;
}

export class RecordWebsitePaymentDto {
  @ApiProperty() @IsNumber() @Min(0) amount: number;
  @ApiProperty() @IsInt() @Min(1) @Max(24) months: number;
  @ApiProperty({ enum: ['CASH', 'UPI', 'BANK', 'RAZORPAY'] }) @IsIn(['CASH', 'UPI', 'BANK', 'RAZORPAY']) method: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(100) reference?: string;
  @ApiProperty({ required: false, description: 'Also switch the website to ACTIVE' }) @IsOptional() @IsBoolean() activate?: boolean;
}

export class CreateEnquiryDto {
  @ApiProperty() @IsString() @MinLength(2) @MaxLength(60) name: string;
  @ApiProperty() @Matches(PHONE, { message: 'Enter a valid 10-digit mobile number' }) phone: string;
  @ApiProperty({ required: false }) @IsOptional() @IsDateString() checkIn?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsInt() @Min(1) @Max(500) guests?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(500) message?: string;
}

export class UpdateEnquiryDto {
  @ApiProperty({ enum: ['NEW', 'CONTACTED', 'BOOKED', 'LOST'] }) @IsIn(['NEW', 'CONTACTED', 'BOOKED', 'LOST']) status: string;
}
