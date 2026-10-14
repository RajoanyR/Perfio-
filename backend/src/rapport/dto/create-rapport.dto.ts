import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateRapportDto {
  // Optionnel : l'auteur est celui du JWT. S'il est fourni, il doit lui correspondre.
  @IsOptional()
  @IsInt()
  id_utilisateur?: number;

  @IsString()
  type: string;

  @IsString()
  format: string;

  @IsOptional()
  @IsDateString()
  periode_debut?: string;

  @IsOptional()
  @IsDateString()
  periode_fin?: string;

  @IsOptional()
  @IsString()
  chemin_fichier?: string;
}
