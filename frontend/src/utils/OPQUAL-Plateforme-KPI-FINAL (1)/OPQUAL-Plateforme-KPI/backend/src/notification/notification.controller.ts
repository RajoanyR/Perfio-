import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { AllowSelf, Roles } from '../common/security/roles.decorator.js';
import { CurrentUser } from '../common/security/current-user.decorator.js';
import type { AuthenticatedUser } from '../common/security/jwt.strategy.js';
import { ROLES_GESTION, ROLE_ADMIN } from '../common/security/role-utils.js';
import { NotificationService } from './notification.service.js';
import { CreateNotificationDto } from './dto/create-notification.dto.js';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  @Get('utilisateur/:id')
  @Roles(ROLE_ADMIN)
  @AllowSelf('id')
  findByUtilisateur(@Param('id', ParseIntPipe) id: number) {
    return this.service.findByUtilisateur(BigInt(id));
  }

  @Post()
  @Roles(...ROLES_GESTION)
  create(@Body() dto: CreateNotificationDto) {
    return this.service.create(dto);
  }

  @Patch(':id/lire')
  marquerLue(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.marquerLue(BigInt(id), user);
  }

  @Patch(':id/non-lire')
  marquerNonLue(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.marquerNonLue(BigInt(id), user);
  }
}
