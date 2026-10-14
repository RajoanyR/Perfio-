import { IsOptional, IsString, MaxLength } from 'class-validator';
export class CreateRoleDto { @IsString() @MaxLength(50) nom_role:string; @IsOptional() @IsString() description?:string; }
