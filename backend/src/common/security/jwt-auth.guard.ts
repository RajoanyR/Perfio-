import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtStrategy } from './jwt.strategy.js';
import { IS_PUBLIC_KEY } from './public.decorator.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtStrategy: JwtStrategy,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: unknown;
    }>();

    const authorization = request.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Authorization: Bearer <token> est obligatoire.',
      );
    }

    const token = authorization.slice(7).trim();

    if (!token) {
      throw new UnauthorizedException('Bearer token manquant.');
    }

    request.user = await this.jwtStrategy.validateToken(token);
    return true;
  }
}
