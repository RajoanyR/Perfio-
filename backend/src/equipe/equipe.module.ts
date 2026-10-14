import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { EquipeController } from './equipe.controller.js';
import { EquipeService } from './equipe.service.js';
@Module({imports:[PrismaModule],controllers:[EquipeController],providers:[EquipeService]})
export class EquipeModule{}
