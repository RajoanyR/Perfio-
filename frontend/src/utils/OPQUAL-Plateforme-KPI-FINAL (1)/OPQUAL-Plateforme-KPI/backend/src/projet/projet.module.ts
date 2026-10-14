import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module.js';
import { ProjetController } from './projet.controller.js';
import { ProjetService } from './projet.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [ProjetController],
  providers: [ProjetService],
})
export class ProjetModule {}