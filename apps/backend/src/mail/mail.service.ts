import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com';
    const port = parseInt(this.configService.get<string>('SMTP_PORT') || '587', 10);
    const user = this.configService.get<string>('SMTP_USER') || 'samimomin40@gmail.com';
    const pass = this.configService.get<string>('SMTP_PASS') || '';

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
  }

  async sendWelcomeEmail(toEmail: string, name: string, tempPassword: string, loginUrl?: string) {
    const defaultUrl = loginUrl || 'http://localhost:3001/login';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; rounded-radius: 8px;">
        <h2 style="color: #0066CC;">Welcome to StayGrid! 🎉</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>You have been registered as an <strong>Owner Admin</strong> on StayGrid.</p>
        <p>Here are your temporary login credentials:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 6px; margin: 15px 0;">
          <p style="margin: 5px 0;"><strong>Email:</strong> ${toEmail}</p>
          <p style="margin: 5px 0;"><strong>Password:</strong> ${tempPassword}</p>
        </div>
        <p>Please log in to your dashboard to manage your farmhouse listings and set pricing:</p>
        <p><a href="${defaultUrl}" style="background-color: #0066CC; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Log in to StayGrid Dashboard</a></p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">For security, please change your password after logging in for the first time.</p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: `"StayGrid Admin" <${this.configService.get<string>('SMTP_USER')}>`,
        to: toEmail,
        subject: 'Welcome to StayGrid — Your Owner Account Credentials',
        html: htmlContent,
      });
      this.logger.log(`Welcome email sent to ${toEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${toEmail}`, error);
    }
  }

  async sendBookingConfirmationEmail(booking: {
    user?: { email?: string | null; name?: string | null } | null;
    farmhouse?: { title?: string | null } | null;
    checkIn: Date | string;
    checkOut: Date | string;
    adults: number;
    children: number;
    totalAmount: number;
    tokenPaid: number;
  }) {
    if (!booking.user?.email) return;
    const name = booking.user.name || 'Guest';
    const farmhouseTitle = booking.farmhouse?.title || 'your farmhouse';
    const checkIn = new Date(booking.checkIn).toLocaleDateString('en-IN');
    const checkOut = new Date(booking.checkOut).toLocaleDateString('en-IN');
    const remaining = Math.max(0, booking.totalAmount - booking.tokenPaid);
    const safe = (value: string) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
    try {
      await this.transporter.sendMail({
        from: '"StayGrid Bookings" <' + this.configService.get<string>('SMTP_USER') + '>',
        to: booking.user.email,
        subject: 'StayGrid booking confirmed — ' + farmhouseTitle,
        html: '<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px"><h2>Booking confirmed</h2><p>Hi ' + escapeHtml(name) + ', your stay is confirmed.</p><p><strong>Property:</strong> ' + escapeHtml(farmhouseTitle) + '<br><strong>Check-in:</strong> ' + checkIn + '<br><strong>Check-out:</strong> ' + checkOut + '<br><strong>Guests:</strong> ' + booking.adults + ' adults, ' + booking.children + ' children</p><p><strong>Total:</strong> ₹' + booking.totalAmount.toLocaleString('en-IN') + '<br><strong>Paid:</strong> ₹' + booking.tokenPaid.toLocaleString('en-IN') + '<br><strong>Balance due:</strong> ₹' + remaining.toLocaleString('en-IN') + '</p><p>Thank you for booking with StayGrid.</p></div>',
      });
      this.logger.log('Booking confirmation email sent to ' + booking.user.email);
    } catch (error) {
      this.logger.error('Failed to send booking confirmation email to ' + booking.user.email, error);
    }
  }

  async sendCashPaymentConfirmedEmail(booking: {
    user?: { email?: string | null; name?: string | null } | null;
    farmhouse?: { title?: string | null } | null;
    totalAmount: number;
    tokenPaid: number;
  }) {
    if (!booking.user?.email) return;
    const balance = Math.max(0, booking.totalAmount - booking.tokenPaid);
    try {
      await this.transporter.sendMail({
        from: '"StayGrid Bookings" <' + this.configService.get<string>('SMTP_USER') + '>',
        to: booking.user.email,
        subject: 'StayGrid payment confirmed — ' + (booking.farmhouse?.title || 'your stay'),
        text: 'Hi ' + (booking.user.name || 'Guest') + ', both you and the host confirmed the remaining cash payment of ₹' + balance.toLocaleString('en-IN') + ' for ' + (booking.farmhouse?.title || 'your stay') + '.',
        html: '<p>Hi ' + (booking.user.name || 'Guest') + ',</p><p>Both you and the host confirmed the remaining cash payment of <strong>₹' + balance.toLocaleString('en-IN') + '</strong> for ' + (booking.farmhouse?.title || 'your stay') + '.</p>',
      });
      this.logger.log('Cash payment confirmation email sent to ' + booking.user.email);
    } catch (error) {
      this.logger.error('Failed to send cash payment confirmation email to ' + booking.user.email, error);
    }
  }

  async sendCancellationEmail(toEmail: string, name: string, farmhouseTitle: string, refundAmount: number, refundStatus: string) {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #EF4444;">Booking Cancellation Confirmation</h2>
        <p>Hi <strong>${escapeHtml(name)}</strong>,</p>
        <p>Your booking for <strong>${escapeHtml(farmhouseTitle)}</strong> has been cancelled.</p>
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 15px 0;">
          <p style="margin: 5px 0;"><strong>Refund Amount:</strong> ₹${refundAmount.toLocaleString('en-IN')}</p>
          <p style="margin: 5px 0;"><strong>Refund Status:</strong> ${escapeHtml(refundStatus)}</p>
        </div>
        <p style="color: #666; font-size: 13px;">If a refund is applicable, it will be processed back to your original payment method within standard bank processing timelines.</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">Thank you for using StayGrid.</p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: `"StayGrid Bookings" <${this.configService.get<string>('SMTP_USER')}>`,
        to: toEmail,
        subject: `Booking Cancellation — ${farmhouseTitle}`,
        html: htmlContent,
      });
      this.logger.log(`Cancellation email sent to ${toEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send cancellation email to ${toEmail}`, error);
    }
  }
}
