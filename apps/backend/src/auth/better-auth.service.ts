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
          role: {
            type: 'string',
            required: false,
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
      baseURL: 'http://localhost:3000',
      trustedOrigins: [
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
