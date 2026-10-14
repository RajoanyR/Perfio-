import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { Roles } from '../common/security/roles.decorator.js';
import { ROLE_ADMIN } from '../common/security/role-utils.js';
import { RolePermissionService } from './role-permission.service.js';
import { CreateRolePermissionDto } from './dto/create-role-permission.dto.js';
@Controller('roles')
export class RolePermissionController{constructor(private readonly service:RolePermissionService){}
@Get(':id/permissions') findByRole(@Param('id',ParseIntPipe) id:number){return this.service.findByRole(BigInt(id))}
@Roles(ROLE_ADMIN) @Post(':id/permissions') create(@Param('id',ParseIntPipe) id:number,@Body() dto:CreateRolePermissionDto){return this.service.create(BigInt(id),dto)}
@Roles(ROLE_ADMIN) @Delete(':id/permissions/:idPermission') remove(@Param('id',ParseIntPipe) id:number,@Param('idPermission',ParseIntPipe) idPermission:number){return this.service.remove(BigInt(id),BigInt(idPermission))} }
