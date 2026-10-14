import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateCommentaireDto {
  // Optionnel : l'auteur est celui du JWT. S'il est fourni, il doit lui correspondre.
  @IsOptional()
  @IsInt()
  id_utilisateur?: number;

  @IsString()
  contenu: string;

  @IsOptional()
  @IsString()
  statut?: string;
}
