import { Body, Controller, Post } from '@nestjs/common';

import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { Public } from '../common/security/public.decorator.js';
import { CurrentUser } from '../common/security/current-user.decorator.js';
import type { AuthenticatedUser } from '../common/security/jwt.strategy.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.service.login(dto);
  }

  /**
   * Ferme la session correspondant au token présenté dans Authorization.
   * Aucun corps n'est nécessaire : la session visée est celle du JWT
   * (impossible de fermer ou de rater une autre session par erreur d'id).
   */
  @Post('logout')
  logout(@CurrentUser() user: AuthenticatedUser) {
    return this.service.logout(user);
  }
}
