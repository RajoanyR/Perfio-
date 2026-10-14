import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CommentaireController } from './commentaire.controller.js';
import { CommentaireService } from './commentaire.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [CommentaireController],
  providers: [CommentaireService],
})
export class CommentaireModule {}
