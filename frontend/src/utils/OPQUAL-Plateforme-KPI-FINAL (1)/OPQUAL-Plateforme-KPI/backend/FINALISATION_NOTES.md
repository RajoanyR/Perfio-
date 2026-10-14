# OPQUAL — notes de vérification finale

## Vérifications effectuées sur le ZIP

- Structure du projet existant analysée.
- `package.json` et `package-lock.json` conservés.
- Architecture NestJS / TypeScript / Prisma / PostgreSQL conservée.
- `prisma/schema.prisma` comparé au ZIP d'origine : identique.
- Aucun fichier de migration ou commande de reset de base ajouté.
- 116 fichiers TypeScript présents dans `src/` avant exclusion des fichiers Prisma générés.
- 64 routes détectées dans les contrôleurs et reprises dans la collection Postman.
- Les routes demandées dans le cahier de finalisation sont toutes présentes dans la collection.
- Les imports relatifs des fichiers TypeScript présents ont été vérifiés statiquement.
- `.env` est ignoré par Git.
- `.env.example` est fourni sans secret réel.
- Le login reste public.
- Les autres routes sont protégées globalement par Bearer JWT.
- Le JWT vérifie signature, expiration, utilisateur actif et session PostgreSQL.
- Le logout vérifie que la session appartient à l'utilisateur authentifié.
- Les permissions du rôle sont chargées dans l'identité JWT.
- `RolesGuard` et `PermissionsGuard` sont disponibles pour les routes qui définissent explicitement une contrainte.
- La validation globale `whitelist + forbidNonWhitelisted + transform` est conservée.
- Le PATCH utilisateur utilise maintenant un DTO validé et le mot de passe est hashé lorsqu'il est modifié.
- CORS est préparé pour React via `FRONTEND_URL`.
- Les erreurs Prisma fréquentes sont traduites en réponses HTTP propres.

## Vérification de compilation

Une compilation TypeScript complète n'a pas pu être exécutée dans l'environnement de travail, car les dépendances npm du ZIP ne sont pas installées et l'installation `npm ci` n'a pas pu terminer dans cet environnement (accès/cache npm insuffisant).

Le contrôle `tsc --noEmit` a donc uniquement confirmé l'absence de compilation possible sans les dépendances : il signale les définitions `node` et `vitest` manquantes, et non une erreur TypeScript issue d'un fichier métier précis.

À exécuter sur la machine de développement après extraction :

```bash
npm install
npx prisma generate
npm run build
npm run test
npm run test:e2e
```

## Base PostgreSQL

La base PostgreSQL réelle n'était pas accessible depuis le ZIP : le `.env` fourni ne contient pas de `DATABASE_URL` exploitable. Aucun test destructif n'a été exécuté et aucune modification de schéma n'a été faite.

## Permissions

Le ZIP ne contient pas de mapping documenté entre chaque endpoint et les valeurs existantes de `permission.code_permission`. La base n'étant pas accessible, créer arbitrairement de nouveaux codes aurait risqué de modifier le comportement de la base existante.

L'infrastructure de contrôle est donc prête :

```ts
@Roles('nom_role_existant')
@Permissions('code_permission_existant')
```

Les valeurs doivent venir des données déjà présentes dans PostgreSQL.
