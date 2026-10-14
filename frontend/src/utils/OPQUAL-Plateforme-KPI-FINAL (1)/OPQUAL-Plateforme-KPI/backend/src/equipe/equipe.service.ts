import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateEquipeDto } from './dto/create-equipe.dto.js';
import { UpdateEquipeDto } from './dto/update-equipe.dto.js';
@Injectable()
export class EquipeService {
 constructor(private readonly prisma:PrismaService){}
 findAll(){return this.prisma.equipe.findMany({orderBy:{id_equipe:'asc'}})}
 async findOne(id:bigint){const x=await this.prisma.equipe.findUnique({where:{id_equipe:id}});if(!x)throw new NotFoundException(`Équipe ${id} introuvable`);return x;}
 async findUsers(id:bigint){await this.findOne(id);return this.prisma.utilisateur.findMany({where:{id_equipe:id},select:{id_utilisateur:true,nom:true,prenom:true,email:true,poste:true,statut:true}})}
 async create(dto:CreateEquipeDto){try{return await this.prisma.equipe.create({data:{...dto}})}catch(e:any){if(e?.code==='P2002')throw new ConflictException('Le nom de l’équipe existe déjà.');throw e;}}
 async update(id:bigint,dto:UpdateEquipeDto){await this.findOne(id);try{return await this.prisma.equipe.update({where:{id_equipe:id},data:{...dto}})}catch(e:any){if(e?.code==='P2002')throw new ConflictException('Le nom de l’équipe existe déjà.');throw e;}}
}
