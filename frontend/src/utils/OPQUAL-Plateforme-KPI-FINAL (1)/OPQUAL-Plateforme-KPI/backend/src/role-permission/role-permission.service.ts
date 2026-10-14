import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateRolePermissionDto } from './dto/create-role-permission.dto.js';
@Injectable()
export class RolePermissionService{
 constructor(private readonly prisma:PrismaService){}
 async findByRole(idRole:bigint){
  const role=await this.prisma.role.findUnique({where:{id_role:idRole}}); if(!role)throw new NotFoundException(`Rôle ${idRole} introuvable`);
  return this.prisma.role_permission.findMany({where:{id_role:idRole},include:{permission:true}});
 }
 async create(idRole:bigint,dto:CreateRolePermissionDto){try{return await this.prisma.role_permission.create({data:{id_role:idRole,id_permission:BigInt(dto.id_permission)}})}catch(e:any){if(e?.code==='P2002')throw new BadRequestException('Cette permission est déjà associée à ce rôle.');if(e?.code==='P2003')throw new BadRequestException('Le rôle ou la permission n’existe pas.');throw e;}}
 async remove(idRole:bigint,idPermission:bigint){try{return await this.prisma.role_permission.delete({where:{id_role_id_permission:{id_role:idRole,id_permission:idPermission}}})}catch(e:any){if(e?.code==='P2025')throw new NotFoundException('Association rôle-permission introuvable.');throw e;}}
}
