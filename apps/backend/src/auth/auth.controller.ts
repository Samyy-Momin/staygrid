import { Controller, All, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { BetterAuthService } from './better-auth.service';
import { toNodeHandler } from 'better-auth/node';

@Controller('auth')
export class AuthController {
  constructor(private betterAuthService: BetterAuthService) {}

  @All('*')
  async handleAuth(@Req() req: Request, @Res() res: Response) {
    const handler = toNodeHandler(this.betterAuthService.auth);
    return handler(req, res);
  }
}
