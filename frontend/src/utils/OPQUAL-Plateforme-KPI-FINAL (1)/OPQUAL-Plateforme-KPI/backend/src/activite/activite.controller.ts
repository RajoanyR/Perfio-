import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { CurrentUser } from '../common/security/current-user.decorator.js';
import type { AuthenticatedUser } from '../common/security/jwt.strategy.js';
import { actorId } from '../common/security/role-utils.js';
import { ActiviteService } from './activite.service.js';
import { CreateActiviteDto } from './dto/create-activite.dto.js';

@Controller('taches')
export class ActiviteController {
  constructor(private readonly service: ActiviteService) {}

  @Get(':id/activites')
  findByTache(@Param('id', ParseIntPipe) id: number) {
    return this.service.findByTache(BigInt(id));
  }

  @Post(':id/activites')
  create(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateActiviteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.create(BigInt(id), {
      ...dto,
      id_utilisateur: actorId(user, dto.id_utilisateur),
    });
  }
}
