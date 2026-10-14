import { IsOptional, IsString, MaxLength } from 'class-validator';
export class CreatePermissionDto { @IsString() @MaxLength(100) code_permission:string; @IsString() @MaxLength(100) nom_permission:string; @IsOptional() @IsString() description?:string; }
