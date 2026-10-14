import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateHistoriqueTacheDto {
  // Optionnel : l'auteur est celui du JWT. S'il est fourni, il doit lui correspondre.
  @IsOptional()
  @IsInt()
  id_utilisateur?: number;

  @IsString()
  @MaxLength(100)
  action: string;

  @IsOptional()
  @IsString()
  description?: string;
}
