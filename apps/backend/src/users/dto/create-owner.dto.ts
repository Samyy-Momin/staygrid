import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateOwnerDto {
  @ApiProperty({
    example: 'owner1@staygrid.com',
    description: 'The email for the new Farmhouse Owner',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'securePassword123',
    description: 'Temporary password for the owner',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John Owner', required: false })
  @IsString()
  name?: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsString()
  phone?: string;
}
