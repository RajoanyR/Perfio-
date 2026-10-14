import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateActiviteDto {
  // Optionnel : l'auteur est celui du JWT. S'il est fourni, il doit lui correspondre.
  @IsOptional()
  @IsInt()
  id_utilisateur?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  temps_passe: number;
}
