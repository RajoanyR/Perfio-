import { IsIn, IsString } from 'class-validator';
import { TACHE_ETATS } from '../tache-etat.js';

export class ChangerEtatDto {
  @IsString()
  @IsIn([...TACHE_ETATS], {
    message: `etat doit valoir : ${TACHE_ETATS.join(', ')}`,
  })
  etat: string;
}
