import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { TacheService } from './tache.service.js';
import { CreateTacheDto } from './dto/create-tache.dto.js';
import { UpdateTacheDto } from './dto/update-tache.dto.js';
import { TransfertTacheDto } from './dto/transfert-tache.dto.js';
import { ChangerEtatDto } from './dto/changer-etat.dto.js';
import { Roles } from '../common/security/roles.decorator.js';
import { CurrentUser } from '../common/security/current-user.decorator.js';
import type { AuthenticatedUser } from '../common/security/jwt.strategy.js';
import { ROLES_GESTION } from '../common/security/role-utils.js';

@Controller('taches')
export class TacheController {
  constructor(private readonly tacheService: TacheService) {}

  // CREER UNE TACHE (administrateur, manager, chef de projet)
  @Post()
  @Roles(...ROLES_GESTION)
  create(@Body() dto: CreateTacheDto, @CurrentUser() user: AuthenticatedUser) {
    return this.tacheService.create(dto, user);
  }

  // LISTE DES TACHES
  @Get()
  findAll() {
    return this.tacheService.findAll();
  }

  // UNE TACHE
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tacheService.findOne(BigInt(id));
  }

  // MODIFIER UNE TACHE (administrateur, manager, chef de projet)
  @Patch(':id')
  @Roles(...ROLES_GESTION)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTacheDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tacheService.update(BigInt(id), dto, user);
  }

  // CHANGER L'ETAT (rôles de gestion, ou responsable de la tâche : contrôle dans le service)
  @Patch(':id/etat')
  changerEtat(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangerEtatDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tacheService.changerEtat(BigInt(id), dto.etat, user);
  }

  // TERMINER UNE TACHE (rôles de gestion, ou responsable de la tâche)
  @Patch(':id/terminer')
  terminer(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tacheService.terminer(BigInt(id), user);
  }

  // TRANSFERER UNE TACHE (administrateur, manager, chef de projet)
  @Post(':id/transfert')
  @Roles(...ROLES_GESTION)
  transfert(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: TransfertTacheDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tacheService.transfert(BigInt(id), dto, user);
  }

  // HISTORIQUE DES TRANSFERTS
  @Get(':id/transferts')
  transferts(@Param('id', ParseIntPipe) id: number) {
    return this.tacheService.transferts(BigInt(id));
  }
}
