import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PieceJointeController } from './piece-jointe.controller.js';
import { PieceJointeService } from './piece-jointe.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [PieceJointeController],
  providers: [PieceJointeService],
})
export class PieceJointeModule {}
