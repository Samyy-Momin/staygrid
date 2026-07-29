import { Controller, All, Req, Res, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { BetterAuthService } from './better-auth.service';
import { toNodeHandler } from 'better-auth/node';
import twilio from 'twilio';

// Temporary in-memory store for OTPs
const otpStore = new Map<string, { code: string; expiresAt: number }>();

@Controller('auth')
export class AuthController {
  constructor(private betterAuthService: BetterAuthService) {}


  @Post('resolve-phone')
  async resolvePhone(@Body('phone') phone: string) {
    if (!phone) throw new HttpException('Phone required', HttpStatus.BAD_REQUEST);
    const user = await this.betterAuthService.prisma.user.findFirst({
      where: { phone: phone.replace(/\s+/g, '') }
    });
    if (!user) throw new HttpException('User not found with this phone number', HttpStatus.NOT_FOUND);
    return { email: user.email };
  }

  @Post('mobile-otp/send')
  async sendMobileOtp(@Body('phoneNumber') rawPhone: string) {
    if (!rawPhone) throw new HttpException('Phone required', HttpStatus.BAD_REQUEST);
    const phoneNumber = rawPhone.replace(/\s+/g, '');
    
    // Generate 4-digit OTP
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    otpStore.set(phoneNumber, { code, expiresAt: Date.now() + 5 * 60 * 1000 });

    try {
      const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      await twilioClient.messages.create({
        body: `Your StayGrid verification code is: ${code}. It will expire in 5 minutes.`,
        from: process.env.TWILIO_WHATSAPP_FROM,
        to: phoneNumber,
      });
      return { success: true, message: 'OTP sent successfully' };
    } catch (error: any) {
      console.error('Twilio Send Error:', error.message || error);
      console.log(`[DEV ONLY] OTP for ${phoneNumber} is: ${code}`);
      return { success: true, message: 'OTP logged to server console (Trial Mode)' };
    }
  }

  @Post('mobile-otp/verify')
  async verifyMobileOtp(@Body() body: { phoneNumber: string; code: string }) {
    if (!body.phoneNumber || !body.code) {
      throw new HttpException('Phone and code required', HttpStatus.BAD_REQUEST);
    }
    const phoneNumber = body.phoneNumber.replace(/\s+/g, '');
    const record = otpStore.get(phoneNumber);

    if (!record) {
      throw new HttpException('OTP not found or expired', HttpStatus.BAD_REQUEST);
    }
    if (Date.now() > record.expiresAt) {
      otpStore.delete(phoneNumber);
      throw new HttpException('OTP expired', HttpStatus.BAD_REQUEST);
    }
    if (record.code !== body.code) {
      throw new HttpException('Invalid OTP', HttpStatus.BAD_REQUEST);
    }

    otpStore.delete(phoneNumber);
    return { success: true, message: 'OTP verified successfully' };
  }

  @All('*')
  async handleAuth(@Req() req: Request, @Res() res: Response) {
    const handler = toNodeHandler(this.betterAuthService.auth);
    return handler(req, res);
  }
}
