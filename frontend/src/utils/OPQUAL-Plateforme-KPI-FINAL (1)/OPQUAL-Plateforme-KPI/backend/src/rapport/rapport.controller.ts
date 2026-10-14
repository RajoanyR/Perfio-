import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { AllowSelf, Roles } from '../common/security/roles.decorator.js';
import { CurrentUser } from '../common/security/current-user.decorator.js';
import type { AuthenticatedUser } from '../common/security/jwt.strategy.js';
import { ROLES_GESTION, actorId } from '../common/security/role-utils.js';
import { RapportService } from './rapport.service.js';
import { CreateRapportDto } from './dto/create-rapport.dto.js';

@Controller('rapports')
export class RapportController {
  constructor(private readonly service: RapportService) {}

  @Get()
  @Roles(...ROLES_GESTION)
  findAll() {
    return this.service.findAll();
  }

  @Get('utilisateur/:id')
  @Roles(...ROLES_GESTION)
  @AllowSelf('id')
  findByUtilisateur(@Param('id', ParseIntPipe) id: number) {
    return this.service.findByUtilisateur(BigInt(id));
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.findOne(BigInt(id), user);
  }

  @Post()
  create(@Body() dto: CreateRapportDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.create({ ...dto, id_utilisateur: actorId(user, dto.id_utilisateur) });
  }
}
