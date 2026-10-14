import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  // Point de contrôle : ne renvoie JAMAIS de données de la base.
  // (Avant : renvoyait tous les utilisateurs, mots de passe hachés compris.)
  getHello(): string {
    return 'Hello World!';
  }
}
