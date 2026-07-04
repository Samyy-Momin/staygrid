import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min } from 'class-validator';

export class CreateOfferDto {
  @ApiProperty({ example: 'Half-Day Package' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Book from 5 AM to 5 PM' })
  @IsString()
  description: string;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(0)
  price: number;
}
