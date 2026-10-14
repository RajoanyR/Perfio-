import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { HistoriqueTacheController } from './historique-tache.controller.js';
import { HistoriqueTacheService } from './historique-tache.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [HistoriqueTacheController],
  providers: [HistoriqueTacheService],
})
export class HistoriqueTacheModule {}
