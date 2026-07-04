import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsNotEmpty, MinLength, IsOptional, IsNumber } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'securePassword123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '+1234567890' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'Male', required: false })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiProperty({ example: 30, required: false })
  @IsOptional()
  @IsNumber()
  age?: number;
}
