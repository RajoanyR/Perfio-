import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PermissionController } from './permission.controller.js';
import { PermissionService } from './permission.service.js';
@Module({imports:[PrismaModule],controllers:[PermissionController],providers:[PermissionService]}) export class PermissionModule{}
