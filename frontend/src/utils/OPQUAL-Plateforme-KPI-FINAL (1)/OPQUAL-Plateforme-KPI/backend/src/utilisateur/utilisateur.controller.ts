import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { AllowSelf, Roles } from '../common/security/roles.decorator.js';
import { CurrentUser } from '../common/security/current-user.decorator.js';
import type { AuthenticatedUser } from '../common/security/jwt.strategy.js';
import { ROLES_UTILISATEURS } from '../common/security/role-utils.js';

import { UtilisateurService } from './utilisateur.service.js';
import { CreateUtilisateurDto } from './dto/create-utilisateur.dto.js';
import { UpdateUtilisateurDto } from './dto/update-utilisateur.dto.js';

@Controller('utilisateurs')
export class UtilisateurController {
  constructor(
    private readonly utilisateurService: UtilisateurService,
  ) {}

  @Get()
  findAll() {
    return this.utilisateurService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.utilisateurService.findOne(id);
  }

  @Post()
  @Roles(...ROLES_UTILISATEURS)
  create(@Body() dto: CreateUtilisateurDto, @CurrentUser() user: AuthenticatedUser) {
    return this.utilisateurService.create(dto, user);
  }

  // Administrateur/manager, ou l'utilisateur lui-même pour son propre profil
  // (champs limités : voir UtilisateurService.update).
  @Patch(':id')
  @Roles(...ROLES_UTILISATEURS)
  @AllowSelf('id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUtilisateurDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.utilisateurService.update(BigInt(id), dto, user);
  }

  @Patch(':id/desactiver')
  @Roles(...ROLES_UTILISATEURS)
  desactiver(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.utilisateurService.desactiver(BigInt(id), user);
  }

  @Patch(':id/activer')
  @Roles(...ROLES_UTILISATEURS)
  activer(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.utilisateurService.activer(BigInt(id), user);
  }
}
