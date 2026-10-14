import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { TacheController } from './tache.controller.js';
import { TacheService } from './tache.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [TacheController],
  providers: [TacheService]
})
export class TacheModule {}
