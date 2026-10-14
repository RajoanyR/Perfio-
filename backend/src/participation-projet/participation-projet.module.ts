import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ParticipationProjetController } from './participation-projet.controller.js';
import { ParticipationProjetService } from './participation-projet.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [ParticipationProjetController],
  providers: [ParticipationProjetService],
})
export class ParticipationProjetModule {}
