import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { CurrentUser } from '../common/security/current-user.decorator.js';
import type { AuthenticatedUser } from '../common/security/jwt.strategy.js';
import { actorId } from '../common/security/role-utils.js';
import { PieceJointeService } from './piece-jointe.service.js';
import { CreatePieceJointeDto } from './dto/create-piece-jointe.dto.js';

@Controller('taches')
export class PieceJointeController {
  constructor(private readonly service: PieceJointeService) {}

  @Get(':id/pieces-jointes')
  findByTache(@Param('id', ParseIntPipe) id: number) {
    return this.service.findByTache(BigInt(id));
  }

  @Post(':id/pieces-jointes')
  create(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreatePieceJointeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.create(BigInt(id), {
      ...dto,
      id_utilisateur: actorId(user, dto.id_utilisateur),
    });
  }

  @Get('commentaires/:id/pieces-jointes')
  findByCommentaire(@Param('id', ParseIntPipe) id: number) {
    return this.service.findByCommentaire(BigInt(id));
  }
}
