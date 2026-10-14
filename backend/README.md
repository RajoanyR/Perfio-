# OPQUAL — Backend final

> **Installation complète de A à Z : voir le fichier `README.md` à la racine du projet.**

Backend REST de OPQUAL basé sur **NestJS + TypeScript + Prisma 7 + PostgreSQL**.

Cette version part du backend fourni. Le schéma Prisma existant a été conservé : aucune table, colonne, relation, contrainte ou donnée PostgreSQL n'est recréée ou réinitialisée par le projet.

## 1. Prérequis

- Node.js compatible avec la version utilisée par le projet
- npm
- PostgreSQL avec la base existante `opqual`
- schéma PostgreSQL `construct`
- Postman pour les tests API

## 2. Installation

```bash
npm install
```

Puis créer `.env` à partir de `.env.example` :

```bash
# Windows PowerShell
Copy-Item .env.example .env

# Git Bash
cp .env.example .env
```

Renseigner au minimum :

```env
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/opqual?schema=construct
JWT_SECRET=une-valeur-longue-et-secrete
PORT=3000
FRONTEND_URL=http://localhost:5173
```

**Ne jamais committer `.env`.** Le vrai secret JWT ne doit pas être placé dans le code.

## 3. Prisma / PostgreSQL

Le projet utilise le schéma Prisma fourni et le driver PostgreSQL.

Pour régénérer le client Prisma :

```bash
npx prisma generate
```

Ne pas exécuter :

```bash
npx prisma migrate reset
```

et ne pas utiliser une migration pour recréer ou contourner la base existante.

La connexion de l'application utilise `DATABASE_URL`.

## 4. Lancement

Développement :

```bash
npm run start:dev
```

Production après compilation :

```bash
npm run build
npm run start:prod
```

API locale :

```text
http://localhost:3000
```

## 5. Validation des données

La validation globale conserve :

- `whitelist: true`
- `forbidNonWhitelisted: true`
- `transform: true`
- `class-validator`

Une propriété non prévue par le DTO est donc refusée.

## 6. Authentification JWT

Le flux est :

```text
POST /auth/login
        ↓
email + mot_de_passe
        ↓
bcrypt
        ↓
JWT signé avec JWT_SECRET
        ↓
session PostgreSQL + hash SHA-256 du JWT
        ↓
Authorization: Bearer <access_token>
        ↓
API protégée
```

`POST /auth/login` est la route publique.

Toutes les autres routes sont protégées par défaut par le `JwtAuthGuard`.

Le guard vérifie :

1. présence de `Authorization: Bearer ...`
2. signature du JWT
3. expiration du JWT
4. présence du `sub`
5. session correspondante dans PostgreSQL
6. session `ACTIVE`
7. absence de date de déconnexion
8. correspondance entre la session et l'utilisateur
9. utilisateur existant et `ACTIF`

Un token expiré, invalide, absent ou associé à une session fermée produit `401 Unauthorized`.

La durée de vie du JWT est actuellement de **1 heure**, conformément au comportement déjà présent dans le backend.

## 7. Logout / sessions

`POST /auth/logout` est maintenant protégé.

Le backend vérifie que `id_session` appartient bien à l'utilisateur authentifié avant de fermer la session.

À la fermeture :

- `statut` devient `FERMEE`
- `date_deconnexion` est renseignée

Un token d'une session fermée ne peut plus être utilisé par le `JwtAuthGuard`.

## 8. Rôles et permissions

Le JWT validé charge également :

- le rôle de l'utilisateur ;
- les codes des permissions associées à ce rôle.

L'architecture de sécurité contient :

- `Roles(...)`
- `RolesGuard`
- `Permissions(...)`
- `PermissionsGuard`

Les guards n'inventent aucun code de permission et n'insèrent aucune donnée dans PostgreSQL. Le ZIP fourni ne contenait pas de mapping documenté entre les endpoints et les valeurs de `permission.code_permission`, et la connexion PostgreSQL du ZIP fourni est vide. Les endpoints existants ne sont donc pas décorés avec des codes arbitraires qui pourraient provoquer des `403` inattendus.

Pour imposer une permission existante sur une future route :

```ts
@Permissions('CODE_PERMISSION_EXISTANT')
```

Pour imposer un rôle existant :

```ts
@Roles('administrateur')
```

Les valeurs doivent correspondre exactement aux données déjà présentes dans PostgreSQL.

## 9. CORS / React

Le backend autorise par défaut :

```text
http://localhost:5173
```

Modifier `FRONTEND_URL` si nécessaire. Plusieurs origines peuvent être séparées par des virgules.

Aucun frontend React n'est inclus ou développé dans ce projet.

## 10. Gestion des erreurs

Le backend conserve les exceptions HTTP NestJS et ajoute une traduction propre des erreurs Prisma fréquentes :

| Situation | HTTP |
|---|---:|
| Données invalides | 400 |
| Token absent/invalide/expiré | 401 |
| Rôle ou permission insuffisant | 403 |
| Ressource inexistante | 404 |
| Contrainte d'unicité | 409 |
| Erreur inattendue | 500 |

Les erreurs serveur inattendues ne renvoient pas le détail interne de Prisma au client.

## 11. BigInt

Les colonnes PostgreSQL/Prisma restent en `BigInt` lorsqu'elles l'étaient dans le schéma fourni.

Aucune colonne n'est convertie en `number` dans Prisma.

La sérialisation JSON existante est conservée pour éviter de casser les réponses API actuelles.

## 12. API réellement présentes

Le projet fourni contient notamment :

### Auth
- `POST /auth/login`
- `POST /auth/logout`

### Utilisateurs
- `GET /utilisateurs`
- `GET /utilisateurs/:id`
- `POST /utilisateurs`
- `PATCH /utilisateurs/:id`
- `PATCH /utilisateurs/:id/desactiver`
- `PATCH /utilisateurs/:id/activer`

### Entreprises
- `GET /entreprises`
- `GET /entreprises/:id`
- `POST /entreprises`
- `PATCH /entreprises/:id`

### Équipes
- `GET /equipes`
- `GET /equipes/:id`
- `GET /equipes/:id/utilisateurs`
- `POST /equipes`
- `PATCH /equipes/:id`

### Rôles
- `GET /roles`
- `GET /roles/:id`
- `POST /roles`
- `PATCH /roles/:id`

### Permissions
- `GET /permissions`
- `GET /permissions/:id`
- `POST /permissions`
- `PATCH /permissions/:id`

### Rôle-permission
- `GET /roles/:id/permissions`
- `POST /roles/:id/permissions`
- `DELETE /roles/:id/permissions/:idPermission`

### Projets
- `GET /projets`
- `GET /projets/:id`
- `POST /projets`
- `PATCH /projets/:id`

### Participants
- `GET /projets/:id/participants`
- `POST /projets/:id/participants`
- `PATCH /projets/:id/participants/:idUtilisateur`

### Tâches
- `GET /taches`
- `GET /taches/:id`
- `POST /taches`
- `PATCH /taches/:id`
- `PATCH /taches/:id/etat`
- `PATCH /taches/:id/terminer`
- `POST /taches/:id/transfert`
- `GET /taches/:id/transferts`

### Activités
- `GET /taches/:id/activites`
- `POST /taches/:id/activites`

### Commentaires
- `GET /taches/:id/commentaires`
- `POST /taches/:id/commentaires`
- `PATCH /taches/commentaires/:id`

### Pièces jointes
- `GET /taches/:id/pieces-jointes`
- `POST /taches/:id/pieces-jointes`
- `GET /taches/commentaires/:id/pieces-jointes`

### Notifications
- `GET /notifications/utilisateur/:id`
- `POST /notifications`
- `PATCH /notifications/:id/lire`
- `PATCH /notifications/:id/non-lire`

### Historique
- `GET /taches/:id/historique`
- `POST /taches/:id/historique`

### Rapports
- `GET /rapports`
- `GET /rapports/utilisateur/:id`
- `GET /rapports/:id`
- `POST /rapports`

### Sessions
- `GET /sessions/utilisateur/:id`
- `PATCH /sessions/:id/fermer`

La route `GET /` existante du projet est également conservée et est protégée comme toutes les routes non publiques.

## 13. Postman

Fichiers fournis :

- `POSTMAN_GUIDE.md`
- `OPQUAL-API.postman_collection.json`

Importer la collection dans Postman puis utiliser :

```text
{{base_url}}
{{access_token}}
{{id_utilisateur}}
{{id_projet}}
{{id_tache}}
{{id_equipe}}
{{id_session}}
```

Le login met automatiquement à jour plusieurs variables de collection lorsque la réponse contient les champs attendus.

## 14. Ordre recommandé

1. `npm install`
2. configurer `.env`
3. `npx prisma generate`
4. `npm run build`
5. `npm run start:dev`
6. `POST /auth/login`
7. vérifier `access_token`
8. exécuter les endpoints protégés avec Bearer Token
9. tester les CRUD
10. tester transfert / historique / sessions
11. tester logout
12. tester un endpoint sans token
13. tester un token invalide
14. tester un token d'une session fermée

## 15. Tests de sécurité attendus

### Sans token

```http
GET /utilisateurs
```

Attendu :

```text
401 Unauthorized
```

### Token incorrect

```http
Authorization: Bearer faux-token
```

Attendu :

```text
401 Unauthorized
```

### Token expiré

Attendu :

```text
401 Unauthorized
```

### Session fermée

Après `POST /auth/logout`, réutiliser le même JWT.

Attendu :

```text
401 Unauthorized
```

### Permission

Lorsqu'une route est annotée avec `@Permissions(...)`, un utilisateur sans le code demandé reçoit :

```text
403 Forbidden
```

## 16. Compilation

```bash
npm run build
```

Puis :

```bash
npm run test
npm run test:e2e
```

Les tests nécessitant PostgreSQL doivent utiliser une base de test appropriée. Aucune commande de reset n'est exécutée par le projet.

## 17. Important concernant la base existante

Le projet final ne contient aucune commande qui :

- supprime les tables ;
- recrée la base ;
- supprime les données ;
- change les types PostgreSQL ;
- modifie les relations existantes ;
- utilise `prisma migrate reset`.

Le schéma Prisma fourni reste la référence de structure.

## 18. Contenu du projet final

Le ZIP final contient le backend complet, notamment :

- `src/`
- `src/generated/prisma/`
- `prisma/schema.prisma`
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `nest-cli.json`
- `.env.example`
- `.gitignore`
- `README.md`
- `POSTMAN_GUIDE.md`
- `OPQUAL-API.postman_collection.json`

Les secrets `.env`, `node_modules`, `dist`, caches TypeScript et le dossier `.git` ne sont pas nécessaires pour redistribuer le projet et ne sont pas inclus dans le ZIP final.
