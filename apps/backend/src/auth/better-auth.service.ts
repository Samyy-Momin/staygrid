import { Injectable } from '@nestjs/common';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { emailOTP } from 'better-auth/plugins';
import * as nodemailer from 'nodemailer';

@Injectable()
export class BetterAuthService {
  public auth: any;

  constructor(public prisma: PrismaService) {
    if (process.env.NODE_ENV === 'production' && (!process.env.BETTER_AUTH_URL || !process.env.AUTH_TRUSTED_ORIGINS)) {
      throw new Error('BETTER_AUTH_URL and AUTH_TRUSTED_ORIGINS are required in production');
    }
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT || 587) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    this.auth = betterAuth({
      database: prismaAdapter(this.prisma, {
        provider: 'postgresql',
      }),
      emailAndPassword: {
        enabled: true,
      },
      user: {
        additionalFields: {
          // input:false — clients must never set their own role via sign-up or update-user.
          role: {
            type: 'string',
            required: false,
            input: false,
            defaultValue: 'CUSTOMER',
          },
          phone: {
            type: 'string',
            required: false,
          },
          gender: {
            type: 'string',
            required: false,
          },
          age: {
            type: 'number',
            required: false,
          }
        },
      },
      // Brute-force protection on login/OTP (Better Auth's limiter; stricter than the global API limit).
      rateLimit: {
        enabled: process.env.NODE_ENV === 'production',
        window: 60,
        max: 30,
        customRules: {
          '/sign-in/email': { window: 60, max: 5 },
          '/email-otp/send-verification-otp': { window: 60, max: 3 },
          '/sign-in/email-otp': { window: 60, max: 5 },
        },
      },
      advanced: { ipAddress: { ipAddressHeaders: ['x-forwarded-for', 'x-real-ip'] } },
      baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
      trustedOrigins: process.env.AUTH_TRUSTED_ORIGINS
        ? process.env.AUTH_TRUSTED_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
        : [
        'http://localhost:3001',
        'http://localhost:3002',
        'http://127.0.0.1:3001',
        'http://192.168.1.8:3000',
        'http://192.168.1.8:8081',
        ],
      plugins: [
        emailOTP({
          otpLength: 6,
          disableSignUp: true,
          async sendVerificationOTP({ email, otp }) {
            try {
              await transporter.sendMail({
                from: `"StayGrid Support" <${process.env.SMTP_USER}>`,
                to: email,
                subject: 'Your StayGrid Verification Code',
                text: `Your StayGrid verification code is ${otp}. It expires in 5 minutes.`,
                html: `<p>Your StayGrid verification code is <strong>${otp}</strong>.</p><p>It expires in 5 minutes.</p>`,
              });
            } catch (err) {
              console.error('SMTP Email Error:', err);
              throw err;
            }
          },
        }),
      ],
    });
  }
}
