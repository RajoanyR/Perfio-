import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { Roles } from '../common/security/roles.decorator.js';
import { ROLE_ADMIN } from '../common/security/role-utils.js';
import { PermissionService } from './permission.service.js';
import { CreatePermissionDto } from './dto/create-permission.dto.js';
import { UpdatePermissionDto } from './dto/update-permission.dto.js';
@Controller('permissions')
export class PermissionController{constructor(private readonly service:PermissionService){}
@Get() findAll(){return this.service.findAll()}
@Get(':id') findOne(@Param('id',ParseIntPipe) id:number){return this.service.findOne(BigInt(id))}
@Roles(ROLE_ADMIN) @Post() create(@Body() dto:CreatePermissionDto){return this.service.create(dto)}
@Roles(ROLE_ADMIN) @Patch(':id') update(@Param('id',ParseIntPipe) id:number,@Body() dto:UpdatePermissionDto){return this.service.update(BigInt(id),dto)} }
