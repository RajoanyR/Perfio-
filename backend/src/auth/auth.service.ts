import { Injectable, UnauthorizedException } from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import { PrismaService } from '../prisma/prisma.service.js';

import * as bcrypt from 'bcrypt';

import { createHash } from 'node:crypto';

import { LoginDto } from './dto/login.dto.js';
import type { AuthenticatedUser } from '../common/security/jwt.strategy.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    // =========================================================
    // 1. Rechercher l'utilisateur par email
    // =========================================================

    const user = await this.prisma.utilisateur.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        'Email ou mot de passe incorrect.',
      );
    }

    // =========================================================
    // 2. Vérifier si le compte est temporairement verrouillé
    // =========================================================

    if (
      user.verrouille_jusqu_a &&
      user.verrouille_jusqu_a > new Date()
    ) {
      throw new UnauthorizedException(
        'Compte temporairement verrouillé.',
      );
    }

    // =========================================================
    // 3. Vérifier le statut du compte
    // =========================================================

    if (user.statut !== 'ACTIF') {
      throw new UnauthorizedException(
        'Compte non actif.',
      );
    }

    // =========================================================
    // 4. Vérifier le mot de passe avec bcrypt
    // =========================================================

    const motDePasseCorrect = await bcrypt.compare(
      dto.mot_de_passe,
      user.mot_de_passe,
    );

    // =========================================================
    // 5. Mauvais mot de passe
    // =========================================================

    if (!motDePasseCorrect) {
      const tentatives = user.tentatives_echec + 1;

      const data: {
        tentatives_echec: number;
        verrouille_jusqu_a?: Date;
      } = {
        tentatives_echec: tentatives,
      };

      // Après 3 tentatives :
      // verrouillage pendant 30 secondes
      if (tentatives >= 3) {
        data.tentatives_echec = 0;

        data.verrouille_jusqu_a = new Date(
          Date.now() + 30_000,
        );
      }

      await this.prisma.utilisateur.update({
        where: {
          id_utilisateur: user.id_utilisateur,
        },

        data,
      });

      if (tentatives >= 3) {
        throw new UnauthorizedException(
          '3 tentatives échouées. Réessayez dans 30 secondes.',
        );
      }

      throw new UnauthorizedException(
        'Email ou mot de passe incorrect.',
      );
    }

    // =========================================================
    // 6. Connexion réussie
    // Remettre les tentatives à zéro
    // =========================================================

    await this.prisma.utilisateur.update({
      where: {
        id_utilisateur: user.id_utilisateur,
      },

      data: {
        tentatives_echec: 0,
        verrouille_jusqu_a: null,
      },
    });

    // =========================================================
    // 7. Générer le JWT
    // =========================================================

    const accessToken = await this.jwtService.signAsync({
      sub: Number(user.id_utilisateur),
      email: user.email,
      id_role: Number(user.id_role),
      id_equipe: Number(user.id_equipe),
    });

    // =========================================================
    // 8. Créer le hash du JWT
    //
    // On ne stocke PAS le token en clair dans la BDD.
    // =========================================================

    const tokenHash = createHash('sha256')
      .update(accessToken)
      .digest('hex');

    // =========================================================
    // 9. Créer la session PostgreSQL
    // =========================================================

    const session = await this.prisma.session.create({
      data: {
        id_utilisateur: user.id_utilisateur,
        token_hash: tokenHash,
      },
    });

    // =========================================================
    // 10. Retourner les informations nécessaires
    // =========================================================

    return {
      message: 'Connexion réussie',

      // Nouveau nom recommandé
      access_token: accessToken,

      // On conserve "token" pour ne pas casser
      // les éventuels tests/clients existants.
      token: accessToken,

      id_session: session.id_session,

      id_utilisateur: user.id_utilisateur,

      id_role: user.id_role,

      id_equipe: user.id_equipe,
    };
  }

  // ===========================================================
  // LOGOUT
  // ===========================================================

  /**
   * Ferme la session du token utilisé pour l'appel (session.statut = 'FERMEE',
   * date_deconnexion renseignée). JwtStrategy refusera ensuite ce JWT avec 401.
   */
  async logout(user: AuthenticatedUser) {
    const resultat = await this.prisma.session.updateMany({
      where: {
        id_session: user.id_session,
        id_utilisateur: user.id_utilisateur,
        statut: 'ACTIVE',
      },
      data: {
        statut: 'FERMEE',
        date_deconnexion: new Date(),
      },
    });

    return {
      message: 'Déconnexion réussie',
      id_session: user.id_session,
      session_fermee: resultat.count > 0,
    };
  }
}
