import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '@prisma/client';
import { BetterAuthService } from '../better-auth.service';
import { Request } from 'express';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private betterAuth: BetterAuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: any }>();

    // Convert NestJS headers to standard Web Headers for better-auth
    const headers = new Headers();
    Object.entries(request.headers).forEach(([key, value]) => {
      if (typeof value === 'string') {
        headers.set(key, value);
      } else if (Array.isArray(value)) {
        headers.set(key, value.join(', '));
      }
    });

    const session = await this.betterAuth.auth.api.getSession({
      headers,
    });

    if (!session || !session.user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Better Auth might strip the 'role' field depending on config, so let's fetch it directly from DB
    const dbUser = await this.betterAuth.prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!dbUser) {
      throw new UnauthorizedException('User not found in database');
    }

    const userRole = dbUser.role;
    const hasRole = requiredRoles.includes(userRole);

    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions');
    }

    // Attach role and full user to request for convenience in controllers
    (request as any).user = {
      ...session.user,
      role: dbUser.role,
    };

    return true;
  }
}
