import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Patch,
} from '@nestjs/common';
import { Roles } from '../common/security/roles.decorator.js';
import { ROLES_GESTION } from '../common/security/role-utils.js';

import { ProjetService } from './projet.service.js';
import { CreateProjetDto } from './dto/create-projet.dto.js';
import { UpdateProjetDto } from './dto/update-projet.dto.js';

@Controller('projets')
export class ProjetController {
  constructor(private readonly projetService: ProjetService) {}

  // POST /projets
  @Roles(...ROLES_GESTION) @Post()
  create(@Body() dto: CreateProjetDto) {
    return this.projetService.create(dto);
  }

  // GET /projets
  @Get()
  findAll() {
    return this.projetService.findAll();
  }

  // GET /projets/:id
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.projetService.findOne(BigInt(id));
  }

  //Modification de projet par id(on peut modifier un seul champ ou plusieurs)
  @Roles(...ROLES_GESTION) @Patch(':id')
  update(
  @Param('id', ParseIntPipe) id: number,
  @Body() dto: UpdateProjetDto,
  ) {
  return this.projetService.update(BigInt(id), dto);
  }
}