import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { RolePermissionController } from './role-permission.controller.js';
import { RolePermissionService } from './role-permission.service.js';
@Module({imports:[PrismaModule],controllers:[RolePermissionController],providers:[RolePermissionService]}) export class RolePermissionModule{}
