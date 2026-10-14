import {
  Body, Controller, Get, Param, ParseIntPipe, Patch, Post,
} from '@nestjs/common';
import { CurrentUser } from '../common/security/current-user.decorator.js';
import type { AuthenticatedUser } from '../common/security/jwt.strategy.js';
import { actorId } from '../common/security/role-utils.js';
import { CommentaireService } from './commentaire.service.js';
import { CreateCommentaireDto } from './dto/create-commentaire.dto.js';
import { UpdateCommentaireDto } from './dto/update-commentaire.dto.js';

@Controller('taches')
export class CommentaireController {
  constructor(private readonly service: CommentaireService) {}

  @Get(':id/commentaires')
  findByTache(@Param('id', ParseIntPipe) id: number) {
    return this.service.findByTache(BigInt(id));
  }

  @Post(':id/commentaires')
  create(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateCommentaireDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.create(BigInt(id), {
      ...dto,
      id_utilisateur: actorId(user, dto.id_utilisateur),
    });
  }

  @Patch('commentaires/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCommentaireDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.update(BigInt(id), dto, user);
  }
}
