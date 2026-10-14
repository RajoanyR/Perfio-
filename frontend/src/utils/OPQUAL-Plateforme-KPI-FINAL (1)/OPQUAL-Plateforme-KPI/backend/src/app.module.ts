import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { UtilisateurModule } from './utilisateur/utilisateur.module.js';
import { ProjetModule } from './projet/projet.module.js';
import { TacheModule } from './tache/tache.module.js';
import { HistoriqueTacheModule } from './historique-tache/historique-tache.module.js';
import { ActiviteModule } from './activite/activite.module.js';
import { CommentaireModule } from './commentaire/commentaire.module.js';
import { PieceJointeModule } from './piece-jointe/piece-jointe.module.js';
import { NotificationModule } from './notification/notification.module.js';
import { ParticipationProjetModule } from './participation-projet/participation-projet.module.js';
import { RapportModule } from './rapport/rapport.module.js';
import { EntrepriseModule } from './entreprise/entreprise.module.js';
import { EquipeModule } from './equipe/equipe.module.js';
import { RoleModule } from './role/role.module.js';
import { PermissionModule } from './permission/permission.module.js';
import { RolePermissionModule } from './role-permission/role-permission.module.js';
import { SessionModule } from './session/session.module.js';
import { AuthModule } from './auth/auth.module.js';
import { JwtAuthGuard } from './common/security/jwt-auth.guard.js';
import { RolesGuard } from './common/security/roles.guard.js';
import { PermissionsGuard } from './common/security/permissions.guard.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    UtilisateurModule,
    ProjetModule,
    TacheModule,
    HistoriqueTacheModule,
    ActiviteModule,
    CommentaireModule,
    PieceJointeModule,
    NotificationModule,
    ParticipationProjetModule,
    RapportModule,
    EntrepriseModule,
    EquipeModule,
    RoleModule,
    PermissionModule,
    RolePermissionModule,
    SessionModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule {}
