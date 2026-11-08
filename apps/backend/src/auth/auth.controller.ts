import { Controller, All, Req, Res, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { BetterAuthService } from './better-auth.service';
import { toNodeHandler } from 'better-auth/node';

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

  @Post('complete-profile')
  async completeProfile(@Body() body: { userId?: string; email?: string; phone: string; name?: string; age?: number; gender?: string }) {
    if (!body.phone) {
      throw new HttpException('Phone number is required to complete profile', HttpStatus.BAD_REQUEST);
    }
    const cleanDigits = body.phone.replace(/[^0-9]/g, '').slice(-10);
    if (cleanDigits.length < 10) {
      throw new HttpException('Valid 10-digit phone required', HttpStatus.BAD_REQUEST);
    }
    const formattedPhone = `+91${cleanDigits}`;

    let existingUser = null;
    if (body.userId) {
      existingUser = await this.betterAuthService.prisma.user.findUnique({ where: { id: body.userId } });
    } else if (body.email) {
      existingUser = await this.betterAuthService.prisma.user.findUnique({ where: { email: body.email } });
    }

    if (!existingUser) {
      // Fallback: try finding first user without phone
      existingUser = await this.betterAuthService.prisma.user.findFirst({
        where: { OR: [{ phone: null }, { phone: "" }] },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!existingUser) {
      throw new HttpException('User account not found', HttpStatus.NOT_FOUND);
    }

    const updatedUser = await this.betterAuthService.prisma.user.update({
      where: { id: existingUser.id },
      data: {
        phone: formattedPhone,
        ...(body.name ? { name: body.name } : {}),
        ...(body.age ? { age: Number(body.age) } : {}),
        ...(body.gender ? { gender: body.gender } : {}),
      },
    });

    return {
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    };
  }

  @All('*')
  async handleAuth(@Req() req: Request, @Res() res: Response) {
    const handler = toNodeHandler(this.betterAuthService.auth);
    return handler(req, res);
  }
}
