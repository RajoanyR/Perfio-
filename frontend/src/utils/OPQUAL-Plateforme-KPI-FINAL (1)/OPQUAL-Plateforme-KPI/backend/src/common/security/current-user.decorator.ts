import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedUser } from './jwt.strategy.js';

/** Récupère l'utilisateur authentifié par JwtAuthGuard : `@CurrentUser() user`. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    return ctx.switchToHttp().getRequest().user as AuthenticatedUser;
  },
);
