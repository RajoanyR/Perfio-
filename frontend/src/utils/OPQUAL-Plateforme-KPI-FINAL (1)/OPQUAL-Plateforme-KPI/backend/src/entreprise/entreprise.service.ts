import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateEntrepriseDto } from './dto/create-entreprise.dto.js';
import { UpdateEntrepriseDto } from './dto/update-entreprise.dto.js';

@Injectable()
export class EntrepriseService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() { return this.prisma.entreprise.findMany({ orderBy: { id_entreprise: 'asc' } }); }
  async findOne(id: bigint) {
    const item = await this.prisma.entreprise.findUnique({ where: { id_entreprise: id } });
    if (!item) throw new NotFoundException(`Entreprise ${id} introuvable`);
    return item;
  }
  async create(dto: CreateEntrepriseDto) {
    try { return await this.prisma.entreprise.create({ data: { ...dto } }); }
    catch (e:any) { if (e?.code === 'P2002') throw new ConflictException('Le nom de l’entreprise existe déjà.'); throw e; }
  }
  async update(id: bigint, dto: UpdateEntrepriseDto) {
    await this.findOne(id);
    try { return await this.prisma.entreprise.update({ where: { id_entreprise: id }, data: { ...dto } }); }
    catch (e:any) { if (e?.code === 'P2002') throw new ConflictException('Le nom de l’entreprise existe déjà.'); throw e; }
  }
}
