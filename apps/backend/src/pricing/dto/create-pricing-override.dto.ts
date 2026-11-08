import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreatePricingOverrideDto {
  @ApiProperty()
  @IsString()
  farmhouseId: string;

  @ApiProperty({ example: '2026-08-15' })
  @IsDateString()
  date: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price12Hours?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price24Hours?: number;

  @ApiProperty({ required: false, example: 'Diwali Special' })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiProperty({ example: 'FESTIVAL', enum: ['WEEKEND', 'FESTIVAL', 'CUSTOM'] })
  @IsString()
  type: string;
}

export class BulkWeekendPricingDto {
  @ApiProperty()
  @IsString()
  farmhouseId: string;

  @ApiProperty({ example: '2026-08-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-08-31' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price12Hours?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price24Hours?: number;
}
