import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsNumber, Min } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ example: '2026-08-01', description: 'Check-in date' })
  @IsDateString()
  checkIn: string;

  @ApiProperty({ example: '2026-08-03', description: 'Check-out date' })
  @IsDateString()
  checkOut: string;

  @ApiProperty({ example: 2, description: 'Number of adults' })
  @IsNumber()
  @Min(1)
  adults: number;

  @ApiProperty({ example: 0, description: 'Number of children' })
  @IsNumber()
  @Min(0)
  children: number;

  @ApiProperty({
    example: 'farmhouse-uuid',
    description: 'ID of the farmhouse',
  })
  @IsString()
  farmhouseId: string;
}
