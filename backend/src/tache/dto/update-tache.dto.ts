import {
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { TACHE_ETATS } from '../tache-etat.js';

export class UpdateTacheDto {
  @IsOptional()
  @IsInt()
  id_projet?: number;

  @IsOptional()
  @IsInt()
  id_responsable?: number;

  @IsOptional()
  @IsInt()
  id_equipe?: number;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  titre?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  priorite?: string;

  @IsOptional()
  @IsString()
  @IsIn([...TACHE_ETATS], {
    message: `etat doit valoir : ${TACHE_ETATS.join(', ')}`,
  })
  etat?: string;

  @IsOptional()
  @IsNumber()
  temps_estime?: number;

  @IsOptional()
  @IsDateString()
  date_debut?: string;

  @IsOptional()
  @IsDateString()
  date_limite?: string;

  @IsOptional()
  @IsDateString()
  date_terminaison?: string;
}