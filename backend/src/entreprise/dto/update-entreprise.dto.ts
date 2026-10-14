import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateEntrepriseDto {
  @IsOptional() @IsString() @MaxLength(150) nom?: string;
  @IsOptional() @IsString() @MaxLength(255) logo?: string;
  @IsOptional() @IsString() @MaxLength(255) adresse?: string;
  @IsOptional() @IsEmail() @MaxLength(150) email?: string;
  @IsOptional() @IsString() @MaxLength(30) telephone?: string;
  @IsOptional() @IsString() informations_generales?: string;
}
