import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { Roles } from '../common/security/roles.decorator.js';
import { CurrentUser } from '../common/security/current-user.decorator.js';
import type { AuthenticatedUser } from '../common/security/jwt.strategy.js';
import { ROLES_UTILISATEURS, actorId } from '../common/security/role-utils.js';
import { HistoriqueTacheService } from './historique-tache.service.js';
import { CreateHistoriqueTacheDto } from './dto/create-historique-tache.dto.js';

@Controller('taches')
export class HistoriqueTacheController {
  constructor(private readonly service: HistoriqueTacheService) {}

  @Get(':id/historique')
  findByTache(@Param('id', ParseIntPipe) id: number) {
    return this.service.findByTache(BigInt(id));
  }

  // L'historique métier est écrit automatiquement par le serveur (TacheService).
  // Cette route reste disponible pour une annotation manuelle (admin/manager).
  @Post(':id/historique')
  @Roles(...ROLES_UTILISATEURS)
  create(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateHistoriqueTacheDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.create(BigInt(id), {
      ...dto,
      id_utilisateur: actorId(user, dto.id_utilisateur),
    });
  }
}
