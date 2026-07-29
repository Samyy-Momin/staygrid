import {
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { BetterAuthService } from '../better-auth.service';
import { Request } from 'express';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private betterAuth: BetterAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: any }>();
    const headers = new Headers();
    Object.entries(request.headers).forEach(([key, value]) => {
      if (typeof value === 'string') {
        headers.set(key, value);
      } else if (Array.isArray(value)) {
        headers.set(key, value.join(', '));
      }
    });

    try {
      const session = await this.betterAuth.auth.api.getSession({ headers });
      if (session && session.user) {
        const dbUser = await this.betterAuth.prisma.user.findUnique({
          where: { id: session.user.id },
          select: { role: true },
        });
        if (dbUser) {
          (request as any).user = {
            ...session.user,
            role: dbUser.role,
          };
        }
      }
    } catch (e) {
      // Ignore errors, proceed as unauthenticated
    }

    return true;
  }
}
