import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
export class CreateEquipeDto {
  @IsString() @MaxLength(100) nom_equipe: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsIn(['ACTIVE','INACTIVE','ARCHIVEE']) statut?: string;
}
