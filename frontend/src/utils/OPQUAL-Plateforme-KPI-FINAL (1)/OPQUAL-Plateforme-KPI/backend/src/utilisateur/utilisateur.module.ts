import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { UtilisateurController } from './utilisateur.controller.js';
import { UtilisateurService } from './utilisateur.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [UtilisateurController],
  providers: [UtilisateurService],
})
export class UtilisateurModule {}