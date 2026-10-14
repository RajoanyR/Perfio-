import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

/**
 * Transforme les erreurs Prisma connues en réponses HTTP propres
 * (sans exposer de détails internes). Les autres exceptions suivent
 * le comportement standard de NestJS.
 */
@Catch()
export class PrismaExceptionFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const mapped = this.mapPrismaError(exception);
    super.catch(mapped ?? exception, host);
  }

  private mapPrismaError(exception: any) {
    const name: string | undefined = exception?.name;

    if (name === 'PrismaClientValidationError') {
      return new BadRequestException('Données invalides.');
    }

    if (name !== 'PrismaClientKnownRequestError') return null;

    switch (exception.code) {
      case 'P2002':
        return new ConflictException(
          "Cette valeur existe déjà (contrainte d'unicité).",
        );
      case 'P2003':
        return new ConflictException(
          'Référence invalide ou ressource liée (contrainte de clé étrangère).',
        );
      case 'P2025':
        return new NotFoundException('Ressource introuvable.');
      case 'P2000':
        return new BadRequestException('Une valeur est trop longue pour son champ.');
      case 'P2004':
        return new BadRequestException(
          'Les données ne respectent pas une contrainte de la base.',
        );
      default:
        return null;
    }
  }
}
