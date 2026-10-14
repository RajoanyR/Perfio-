import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Min,
  Max,
} from 'class-validator';

export class CreateUtilisateurDto {
  @IsInt()
  @Min(1)
  id_entreprise: number;

  @IsInt()
  @Min(1)
  id_role: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  id_equipe?: number;

  @IsString()
  @IsNotEmpty()
  nom: string;

  // Facultatif : beaucoup de personnes n'ont pas de prénom. La colonne est NOT NULL en base,
  // une chaîne vide est donc enregistrée à la place (voir UtilisateurService.create).
  @IsOptional()
  @IsString()
  @MaxLength(100)
  prenom?: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  mot_de_passe: string;

  @IsOptional()
  @IsString()
  telephone?: string;

  @IsString()
  @IsNotEmpty()
  poste: string;

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