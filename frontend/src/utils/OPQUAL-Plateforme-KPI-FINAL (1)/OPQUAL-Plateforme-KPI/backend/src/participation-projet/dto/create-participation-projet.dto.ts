import { IsIn, IsInt, IsOptional } from 'class-validator';

export class CreateParticipationProjetDto {
  @IsInt()
  id_utilisateur: number;

  // Valeurs autorisées par la contrainte PostgreSQL ck_participation_projet_1.
  @IsOptional()
  @IsIn(['ACTIF', 'RETIRE'], { message: 'statut doit valoir ACTIF ou RETIRE' })
  statut?: string;
}
