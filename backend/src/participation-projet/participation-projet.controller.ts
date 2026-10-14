import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { Roles } from '../common/security/roles.decorator.js';
import { ROLES_GESTION } from '../common/security/role-utils.js';
import { ParticipationProjetService } from './participation-projet.service.js';
import { CreateParticipationProjetDto } from './dto/create-participation-projet.dto.js';
import { UpdateParticipationProjetDto } from './dto/update-participation-projet.dto.js';

@Controller('projets')
export class ParticipationProjetController {
  constructor(private readonly service: ParticipationProjetService) {}

  @Get(':id/participants')
  findByProjet(@Param('id', ParseIntPipe) id: number) {
    return this.service.findByProjet(BigInt(id));
  }

  @Roles(...ROLES_GESTION) @Post(':id/participants')
  create(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateParticipationProjetDto,
  ) {
    return this.service.create(BigInt(id), dto);
  }

  @Roles(...ROLES_GESTION) @Patch(':id/participants/:idUtilisateur')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Param('idUtilisateur', ParseIntPipe) idUtilisateur: number,
    @Body() dto: UpdateParticipationProjetDto,
  ) {
    return this.service.update(BigInt(id), BigInt(idUtilisateur), dto);
  }
}
