import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreatePermissionDto } from './dto/create-permission.dto.js';
import { UpdatePermissionDto } from './dto/update-permission.dto.js';
@Injectable()
export class PermissionService{
 constructor(private readonly prisma:PrismaService){}
 findAll(){return this.prisma.permission.findMany({orderBy:{id_permission:'asc'}})}
 async findOne(id:bigint){const x=await this.prisma.permission.findUnique({where:{id_permission:id}});if(!x)throw new NotFoundException(`Permission ${id} introuvable`);return x;}
 async create(dto:CreatePermissionDto){try{return await this.prisma.permission.create({data:{...dto}})}catch(e:any){if(e?.code==='P2002')throw new ConflictException('Le code de permission existe déjà.');throw e;}}
 async update(id:bigint,dto:UpdatePermissionDto){await this.findOne(id);try{return await this.prisma.permission.update({where:{id_permission:id},data:{...dto}})}catch(e:any){if(e?.code==='P2002')throw new ConflictException('Le code de permission existe déjà.');throw e;}}
}
