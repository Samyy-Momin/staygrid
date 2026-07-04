import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class VerifyPaymentDto {
  @ApiProperty({ description: 'Razorpay Payment ID' })
  @IsString()
  razorpayPaymentId: string;

  @ApiProperty({ description: 'Razorpay Order ID' })
  @IsString()
  razorpayOrderId: string;

  @ApiProperty({ description: 'Razorpay Signature' })
  @IsString()
  razorpaySignature: string;
}
