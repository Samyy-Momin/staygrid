import { Injectable } from '@nestjs/common';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { phoneNumber, emailOTP } from 'better-auth/plugins';
import * as nodemailer from 'nodemailer';
import twilio from 'twilio';

@Injectable()
export class BetterAuthService {
  public auth: any;

  constructor(public prisma: PrismaService) {
    const twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false, // STARTTLS
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
        phoneNumber({
          sendOTP: async ({ phoneNumber, code }) => {
            if (process.env.TWILIO_AUTH_TOKEN !== 'your_auth_token_here') {
              try {
                await twilioClient.messages.create({
                  body: `Your StayGrid verification code is: ${code}. It will expire in 5 minutes. <#>\n\n@staygrid.com #${code}`,
                  from: process.env.TWILIO_WHATSAPP_FROM?.replace(
                    'whatsapp:',
                    '',
                  ), // SMS sender
                  to: phoneNumber,
                });
              } catch (err) {
                console.error('Twilio SMS Error:', err);
              }
            } else {
              console.log(`[DEV ONLY] SMS OTP for ${phoneNumber}: ${code}`);
            }
          },
        }),
        emailOTP({
          async sendVerificationOTP({ email, otp }) {
            try {
              await transporter.sendMail({
                from: `"StayGrid Support" <${process.env.SMTP_USER}>`,
                to: email,
                subject: 'Your StayGrid Verification Code',
                text: `Your verification code is: ${otp}`,
                html: `<p>Your verification code is: <strong>${otp}</strong></p>`,
              });
            } catch (err) {
              console.error('SMTP Email Error:', err);
            }
          },
        }),
      ],
    });
  }
}
