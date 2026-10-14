import { IsInt, IsString, MinLength } from 'class-validator';

/**
 * L'utilisateur qui réalise le transfert n'est plus fourni par le client :
 * il est lu dans le JWT (request.user) et enregistré côté serveur.
 */
export class TransfertTacheDto {
  @IsInt()
  nouveau_responsable: number;

  @IsInt()
  nouvelle_equipe: number;

  @IsString()
  @MinLength(1)
  motif: string;
}
