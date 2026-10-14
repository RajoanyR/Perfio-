import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { RoleController } from './role.controller.js';
import { RoleService } from './role.service.js';
@Module({imports:[PrismaModule],controllers:[RoleController],providers:[RoleService]}) export class RoleModule{}
