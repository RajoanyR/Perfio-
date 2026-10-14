import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { RapportController } from './rapport.controller.js';
import { RapportService } from './rapport.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [RapportController],
  providers: [RapportService],
})
export class RapportModule {}
