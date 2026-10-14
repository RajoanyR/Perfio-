import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateUtilisateurDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  id_entreprise?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  id_role?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  id_equipe?: number;

  @IsOptional()
  @IsString()
  nom?: string;

  @IsOptional()
  @IsString()
  prenom?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  mot_de_passe?: string;

  @IsOptional()
  @IsString()
  telephone?: string;

  @IsOptional()
  @IsString()
  poste?: string;

  @IsOptional()
  @IsString()
  theme?: string;

  @IsOptional()
  @IsString()
  statut?: string;

  @IsOptional()
  @Min(1)
  @Max(60)
  capacite_hebdomadaire_heures?: number;
}
