import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { EntrepriseController } from './entreprise.controller.js';
import { EntrepriseService } from './entreprise.service.js';
@Module({ imports:[PrismaModule], controllers:[EntrepriseController], providers:[EntrepriseService] })
export class EntrepriseModule {}
