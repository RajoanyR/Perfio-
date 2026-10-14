import { IsOptional, IsString, MaxLength } from 'class-validator';
export class UpdatePermissionDto { @IsOptional() @IsString() @MaxLength(100) code_permission?:string; @IsOptional() @IsString() @MaxLength(100) nom_permission?:string; @IsOptional() @IsString() description?:string; }
