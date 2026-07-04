import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min, IsArray } from 'class-validator';

export class CreateFarmhouseDto {
  @ApiProperty({
    example: 'Sunset Villa',
    description: 'Name of the farmhouse',
  })
  @IsString()
  title: string;

  @ApiProperty({
    example: 'A beautiful villa with a sunset view.',
    description: 'Farmhouse description',
  })
  @IsString()
  description: string;

  @ApiProperty({ example: 150.0, description: 'Price per night in USD' })
  @IsNumber()
  @Min(0)
  pricePerNight: number;

  @ApiProperty({ example: 10, description: 'Maximum guest capacity' })
  @IsNumber()
  @Min(1)
  capacity: number;

  @ApiProperty({
    example: '10x20 ft',
    description: 'Pool dimensions',
    required: false,
  })
  @IsOptional()
  @IsString()
  poolSize?: string;

  @ApiProperty({
    example: ['WiFi', 'BBQ', 'Pool'],
    description: 'List of amenities',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiProperty({
    example: ['https://res.cloudinary.com/..'],
    description: 'List of photo URLs',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];

  @ApiProperty({
    example: 'uuid-string',
    description: 'Owner ID (if created by System Admin for an Owner)',
    required: false,
  })
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiProperty({
    example: ['Manager: +919876543210'],
    description: 'List of contact numbers',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  contactNumbers?: string[];

  @ApiProperty({
    example: 2000,
    description: 'Fixed token deposit amount required to book',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tokenAmount?: number;
}
