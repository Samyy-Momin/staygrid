import { Controller, All, Req, Res, Post, Body, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { BetterAuthService } from './better-auth.service';
import { toNodeHandler } from 'better-auth/node';
import { RolesGuard } from './guards/roles.guard';

@Controller('auth')
export class AuthController {
  constructor(private betterAuthService: BetterAuthService) {}


  @Post('complete-profile')
  @UseGuards(RolesGuard)
  async completeProfile(@Req() req: Request & { user?: { id: string } }, @Body() body: { phone: string; name?: string; age?: number; gender?: string }) {
    if (!body.phone) {
      throw new HttpException('Phone number is required to complete profile', HttpStatus.BAD_REQUEST);
    }
    const cleanDigits = body.phone.replace(/[^0-9]/g, '').slice(-10);
    if (cleanDigits.length < 10) {
      throw new HttpException('Valid 10-digit phone required', HttpStatus.BAD_REQUEST);
    }
    const formattedPhone = `+91${cleanDigits}`;

    const existingUser = req.user?.id
      ? await this.betterAuthService.prisma.user.findUnique({ where: { id: req.user.id } })
      : null;

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
