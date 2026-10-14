import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateProjetDto {
  @IsInt()
  id_equipe: number;

  @IsInt()
  id_chef_projet: number;

  @IsString()
  @MaxLength(150)
  nom_projet: string;

  @IsString()
  @MaxLength(50)
  code_projet: string;

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

  @IsDateString()
  date_debut: string;

  @IsDateString()
  date_fin_prevue: string;

  @IsOptional()
  @IsDateString()
  date_fin_reelle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  statut?: string;
}