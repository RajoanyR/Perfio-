import { IsInt, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreatePieceJointeDto {
  @IsOptional()
  @IsInt()
  id_tache?: number;

  @IsOptional()
  @IsInt()
  id_commentaire?: number;

  // Optionnel : l'auteur est celui du JWT. S'il est fourni, il doit lui correspondre.
  @IsOptional()
  @IsInt()
  id_utilisateur?: number;

  @IsString()
  nom_fichier: string;

  @IsString()
  chemin_fichier: string;

  @IsOptional()
  @IsString()
  type_fichier?: string;

  @IsOptional()
  @IsNumber()
  taille?: number;
}
