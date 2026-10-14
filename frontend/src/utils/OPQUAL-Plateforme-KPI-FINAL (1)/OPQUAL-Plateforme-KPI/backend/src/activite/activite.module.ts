import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ActiviteController } from './activite.controller.js';
import { ActiviteService } from './activite.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [ActiviteController],
  providers: [ActiviteService],
})
export class ActiviteModule {}
