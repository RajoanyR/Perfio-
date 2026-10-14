import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateRoleDto } from './dto/create-role.dto.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';
@Injectable()
export class RoleService{
 constructor(private readonly prisma:PrismaService){}
 findAll(){return this.prisma.role.findMany({orderBy:{id_role:'asc'}})}
 async findOne(id:bigint){const x=await this.prisma.role.findUnique({where:{id_role:id}});if(!x)throw new NotFoundException(`Rôle ${id} introuvable`);return x;}
 async create(dto:CreateRoleDto){try{return await this.prisma.role.create({data:{...dto}})}catch(e:any){if(e?.code==='P2002')throw new ConflictException('Ce nom de rôle existe déjà.');throw e;}}
 async update(id:bigint,dto:UpdateRoleDto){await this.findOne(id);try{return await this.prisma.role.update({where:{id_role:id},data:{...dto}})}catch(e:any){if(e?.code==='P2002')throw new ConflictException('Ce nom de rôle existe déjà.');throw e;}}
}
