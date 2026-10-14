import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import type { AuthenticatedUser } from '../common/security/jwt.strategy.js';
import { ROLE_ADMIN, aRole } from '../common/security/role-utils.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateNotificationDto } from './dto/create-notification.dto.js';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async findByUtilisateur(idUtilisateur: bigint) {
    return this.prisma.notification.findMany({
      where: { id_utilisateur: idUtilisateur },
      orderBy: { date_creation: 'desc' },
    });
  }

  async create(dto: CreateNotificationDto) {
    try {
      return await this.prisma.notification.create({
        data: {
          id_utilisateur: BigInt(dto.id_utilisateur),
          type: dto.type,
          message: dto.message,
          est_lue: dto.est_lue ?? false,
          ...(dto.est_lue ? { date_lecture: new Date() } : {}),
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2003') {
        throw new BadRequestException('L’utilisateur indiqué n’existe pas.');
      }
      throw error;
    }
  }

  async marquerLue(id: bigint, user: AuthenticatedUser) {
    const notification = await this.prisma.notification.findUnique({
      where: { id_notification: id },
    });
    if (!notification) throw new NotFoundException(`Notification ${id} introuvable`);
    if (notification.id_utilisateur !== user.id_utilisateur && !aRole(user, ROLE_ADMIN)) {
      throw new ForbiddenException('Cette notification ne vous appartient pas.');
    }

    return this.prisma.notification.update({
      where: { id_notification: id },
      data: {
        est_lue: true,
        date_lecture: new Date(),
      },
    });
  }

  async marquerNonLue(id: bigint, user: AuthenticatedUser) {
    const notification = await this.prisma.notification.findUnique({
      where: { id_notification: id },
    });
    if (!notification) throw new NotFoundException(`Notification ${id} introuvable`);
    if (notification.id_utilisateur !== user.id_utilisateur && !aRole(user, ROLE_ADMIN)) {
      throw new ForbiddenException('Cette notification ne vous appartient pas.');
    }

    return this.prisma.notification.update({
      where: { id_notification: id },
      data: {
        est_lue: false,
        date_lecture: null,
      },
    });
  }
}
