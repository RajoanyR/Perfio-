import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { Roles } from '../common/security/roles.decorator.js';
import { ROLE_ADMIN } from '../common/security/role-utils.js';
import { RoleService } from './role.service.js';
import { CreateRoleDto } from './dto/create-role.dto.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';
@Controller('roles')
export class RoleController{constructor(private readonly service:RoleService){}
@Get() findAll(){return this.service.findAll()}
@Get(':id') findOne(@Param('id',ParseIntPipe) id:number){return this.service.findOne(BigInt(id))}
@Roles(ROLE_ADMIN) @Post() create(@Body() dto:CreateRoleDto){return this.service.create(dto)}
@Roles(ROLE_ADMIN) @Patch(':id') update(@Param('id',ParseIntPipe) id:number,@Body() dto:UpdateRoleDto){return this.service.update(BigInt(id),dto)} }
