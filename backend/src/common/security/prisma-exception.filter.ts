import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    const error = exception as { code?: string; message?: string };

    if (exception instanceof HttpException) {
      response.status(exception.getStatus()).json(exception.getResponse());
      return;
    }

    if ((exception as { name?: string })?.name === 'PrismaClientValidationError') {
      this.logger.warn(error?.message ?? 'Erreur de validation Prisma');
      response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Données invalides.',
      });
      return;
    }

    // Contrainte CHECK PostgreSQL (SQLSTATE 23514) : valeur refusée par une règle de la base.
    if (typeof error?.message === 'string' && /23514|contrainte de vérification|check constraint/i.test(error.message)) {
      const nom = error.message.match(/(?:vérification|constraint)\s*[«"]\s*([^»"]+?)\s*[»"]/i)?.[1];
      this.logger.warn(`Contrainte CHECK refusée${nom ? ` (${nom})` : ''}`);
      response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Valeur refusée par une règle de la base de données${nom ? ` (${nom})` : ''}.`,
      });
      return;
    }

    if (error?.code === 'P2002') {
      response.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        message: 'Une ressource avec cette valeur existe déjà.',
      });
      return;
    }

    if (error?.code === 'P2003') {
      response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Une référence liée n’existe pas.',
      });
      return;
    }

    if (error?.code === 'P2025') {
      response.status(HttpStatus.NOT_FOUND).json({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Ressource introuvable.',
      });
      return;
    }

    // Erreur inattendue : détail dans les logs serveur, message générique au client.
    this.logger.error(
      error?.message ?? 'Erreur inconnue',
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Une erreur serveur inattendue est survenue.',
    });
  }
}
