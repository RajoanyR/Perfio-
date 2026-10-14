import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { Roles } from '../common/security/roles.decorator.js';
import { ROLE_ADMIN } from '../common/security/role-utils.js';
import { EntrepriseService } from './entreprise.service.js';
import { CreateEntrepriseDto } from './dto/create-entreprise.dto.js';
import { UpdateEntrepriseDto } from './dto/update-entreprise.dto.js';

@Controller('entreprises')
export class EntrepriseController {
  constructor(private readonly service: EntrepriseService) {}
  @Get() findAll() { return this.service.findAll(); }
  @Get(':id') findOne(@Param('id', ParseIntPipe) id:number) { return this.service.findOne(BigInt(id)); }
  @Roles(ROLE_ADMIN) @Post() create(@Body() dto:CreateEntrepriseDto) { return this.service.create(dto); }
  @Roles(ROLE_ADMIN) @Patch(':id') update(@Param('id', ParseIntPipe) id:number, @Body() dto:UpdateEntrepriseDto) { return this.service.update(BigInt(id), dto); }
}
