import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ResetOwnerPasswordDto {
  @ApiProperty({ description: 'ID of the owner user account' })
  @IsString()
  ownerId: string;

  @ApiProperty({ description: 'New password for the owner account', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  newPassword: string;
}
