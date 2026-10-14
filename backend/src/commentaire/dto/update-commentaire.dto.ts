import { IsOptional, IsString } from 'class-validator';

export class UpdateCommentaireDto {
  @IsOptional()
  @IsString()
  contenu?: string;

  @IsOptional()
  @IsString()
  statut?: string;
}
