import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from '../auth-user.interface.js';

/** Récupère l'utilisateur authentifié : `@CurrentUser() user: AuthUser`. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as AuthUser;
  },
);
