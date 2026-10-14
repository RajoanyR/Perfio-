import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { SessionController } from './session.controller.js';
import { SessionService } from './session.service.js';
@Module({imports:[PrismaModule],controllers:[SessionController],providers:[SessionService]}) export class SessionModule{}
