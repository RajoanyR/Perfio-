import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateProjetDto {
  @IsOptional()
  @IsInt()
  id_equipe?: number;

  @IsOptional()
  @IsInt()
  id_chef_projet?: number;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  nom_projet?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  code_projet?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  priorite?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  etat?: string;

  @IsOptional()
  @IsDateString()
  date_debut?: string;

  @IsOptional()
  @IsDateString()
  date_fin_prevue?: string;

  @IsOptional()
  @IsDateString()
  date_fin_reelle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  statut?: string;
}