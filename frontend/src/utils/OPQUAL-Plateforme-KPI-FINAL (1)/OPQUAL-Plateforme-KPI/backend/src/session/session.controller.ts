import { Controller, Get, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { SessionService } from './session.service.js';
import { AllowSelf, Roles } from '../common/security/roles.decorator.js';
import { CurrentUser } from '../common/security/current-user.decorator.js';
import type { AuthenticatedUser } from '../common/security/jwt.strategy.js';
import { ROLE_ADMIN } from '../common/security/role-utils.js';

@Controller('sessions')
export class SessionController {
  constructor(private readonly service: SessionService) {}

  // Ses propres sessions, ou toutes celles d'un utilisateur pour un administrateur.
  @Get('utilisateur/:id')
  @Roles(ROLE_ADMIN)
  @AllowSelf('id')
  findByUtilisateur(@Param('id', ParseIntPipe) id: number) {
    return this.service.findByUtilisateur(BigInt(id));
  }

  // Une session ne peut être fermée que par son propriétaire ou un administrateur.
  @Patch(':id/fermer')
  fermer(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.fermer(BigInt(id), user);
  }
}
