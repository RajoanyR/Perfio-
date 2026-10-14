import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { Roles } from '../common/security/roles.decorator.js';
import { ROLES_GESTION } from '../common/security/role-utils.js';
import { EquipeService } from './equipe.service.js';
import { CreateEquipeDto } from './dto/create-equipe.dto.js';
import { UpdateEquipeDto } from './dto/update-equipe.dto.js';
@Controller('equipes')
export class EquipeController{
 constructor(private readonly service:EquipeService){}
 @Get() findAll(){return this.service.findAll()}
 @Get(':id') findOne(@Param('id',ParseIntPipe) id:number){return this.service.findOne(BigInt(id))}
 @Get(':id/utilisateurs') findUsers(@Param('id',ParseIntPipe) id:number){return this.service.findUsers(BigInt(id))}
 @Roles(...ROLES_GESTION) @Post() create(@Body() dto:CreateEquipeDto){return this.service.create(dto)}
 @Roles(...ROLES_GESTION) @Patch(':id') update(@Param('id',ParseIntPipe) id:number,@Body() dto:UpdateEquipeDto){return this.service.update(BigInt(id),dto)}
}
