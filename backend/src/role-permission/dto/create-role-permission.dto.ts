import { IsInt } from 'class-validator';
export class CreateRolePermissionDto { @IsInt() id_permission:number; }
