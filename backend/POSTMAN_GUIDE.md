# OPQUAL — GUIDE POSTMAN
## 1. Préparation
1. Démarrer PostgreSQL avec la base existante `opqual` et le schéma `construct`.
2. Configurer `.env`.
3. Lancer `npm run start:dev`.
4. Importer `OPQUAL-API.postman_collection.json`.
5. Vérifier `{{base_url}} = http://localhost:3000`.
6. Ne pas remplacer les variables d'identifiants par des valeurs inventées : récupérer les vrais IDs avec les GET ou avec les réponses de création.
## 2. Authentification Postman
`POST /auth/login` est la seule route publique. Toutes les autres routes utilisent `Authorization: Bearer {{access_token}}`.

La collection contient un script de test sur le login qui récupère automatiquement `access_token`, `id_session`, `id_utilisateur`, `id_role` et `id_equipe` lorsque la réponse les fournit.
Réponse attendue du login :
```json
{
  "message": "Connexion réussie",
  "access_token": "...",
  "token": "...",
  "id_session": 0,
  "id_utilisateur": 0,
  "id_role": 0,
  "id_equipe": 0
}
```
Les valeurs numériques ci-dessus sont uniquement la forme de la réponse : utilisez les valeurs réellement retournées par votre base.
## 3. Règles communes
- Header des requêtes JSON : `Content-Type: application/json`.
- Requêtes protégées : `Authorization: Bearer {{access_token}}`.
- `401` : token absent, invalide, expiré ou session fermée.
- `403` : rôle/permission insuffisant lorsqu'une route possède une contrainte de sécurité correspondante.
- `404` : ressource inexistante.
- `409` : conflit d'unicité.
- `400` : validation ou référence étrangère invalide.
## 4. Ordre de test recommandé
1. Démarrage NestJS
2. Login
3. Utilisateurs
4. Entreprises
5. Équipes
6. Rôles
7. Permissions
8. Rôle-permission
9. Projets
10. Participants
11. Tâches
12. État / terminaison
13. Transfert
14. Activités
15. Commentaires
16. Pièces jointes
17. Notifications
18. Historique
19. Rapports
20. Sessions
21. Logout
22. Accès sans token
23. Token invalide
24. Token expiré/session fermée
## 5. Endpoints réellement présents
### Auth
#### `POST /auth/login`
- **Token :** NON
- **Headers :** `Content-Type: application/json` pour POST/PATCH avec body; `Authorization: Bearer {{access_token}}` pour toute route protégée.
- **Body JSON :**
```json
{
  "email": "EMAIL_DE_TEST",
  "mot_de_passe": "MOT_DE_PASSE_DE_TEST"
}
```
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** backend démarré.
#### `POST /auth/logout`
- **Token :** OUI
- **Headers :** `Content-Type: application/json` pour POST/PATCH avec body; `Authorization: Bearer {{access_token}}` pour toute route protégée.
- **Body JSON :**
```json
{
  "id_session": {{id_session}}
}
```
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** session existante et active pour les opérations protégées.
### Utilisateurs
#### `GET /utilisateurs`
- **Token :** OUI
- **Headers :** `Authorization: Bearer {access_token}`.
- **Body :** aucun.
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** utilisateur existant.
#### `GET /utilisateurs/{{id_utilisateur}}`
- **Token :** OUI
- **Headers :** `Authorization: Bearer {access_token}`.
- **Body :** aucun.
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** utilisateur existant.
#### `POST /utilisateurs`
- **Token :** OUI
- **Headers :** `Content-Type: application/json` pour POST/PATCH avec body; `Authorization: Bearer {{access_token}}` pour toute route protégée.
- **Body JSON :**
```json
{
  "id_entreprise": {{id_entreprise}},
  "id_role": {{id_role}},
  "id_equipe": {{id_equipe}},
  "nom": "Nom",
  "prenom": "Prenom",
  "email": "nouvel-utilisateur@example.com",
  "mot_de_passe": "MotDePasse123!",
  "poste": "Collaborateur"
}
```
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** utilisateur existant.
#### `PATCH /utilisateurs/{{id_utilisateur}}`
- **Token :** OUI
- **Headers :** `Content-Type: application/json` pour POST/PATCH avec body; `Authorization: Bearer {{access_token}}` pour toute route protégée.
- **Body JSON :**
```json
{
  "poste": "Chef de projet"
}
```
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** utilisateur existant.
#### `PATCH /utilisateurs/{{id_utilisateur}}/desactiver`
- **Token :** OUI
- **Headers :** `Content-Type: application/json` pour POST/PATCH avec body; `Authorization: Bearer {{access_token}}` pour toute route protégée.
- **Body JSON :** voir le DTO correspondant dans `src/**/dto/`; la validation globale rejette les champs non prévus.
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** utilisateur existant.
#### `PATCH /utilisateurs/{{id_utilisateur}}/activer`
- **Token :** OUI
- **Headers :** `Content-Type: application/json` pour POST/PATCH avec body; `Authorization: Bearer {{access_token}}` pour toute route protégée.
- **Body JSON :** voir le DTO correspondant dans `src/**/dto/`; la validation globale rejette les champs non prévus.
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** utilisateur existant.
### Entreprises
#### `GET /entreprises`
- **Token :** OUI
- **Headers :** `Authorization: Bearer {access_token}`.
- **Body :** aucun.
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** backend démarré.
#### `GET /entreprises/{{id_entreprise}}`
- **Token :** OUI
- **Headers :** `Authorization: Bearer {access_token}`.
- **Body :** aucun.
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** backend démarré.
#### `POST /entreprises`
- **Token :** OUI
- **Headers :** `Content-Type: application/json` pour POST/PATCH avec body; `Authorization: Bearer {{access_token}}` pour toute route protégée.
- **Body JSON :**
```json
{
  "nom": "Entreprise Test"
}
```
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** backend démarré.
#### `PATCH /entreprises/{{id_entreprise}}`
- **Token :** OUI
- **Headers :** `Content-Type: application/json` pour POST/PATCH avec body; `Authorization: Bearer {{access_token}}` pour toute route protégée.
- **Body JSON :**
```json
{
  "nom": "Entreprise Test Modifiée"
}
```
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** backend démarré.
### Équipes
#### `GET /equipes`
- **Token :** OUI
- **Headers :** `Authorization: Bearer {access_token}`.
- **Body :** aucun.
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** équipe existante.
#### `GET /equipes/{{id_equipe}}`
- **Token :** OUI
- **Headers :** `Authorization: Bearer {access_token}`.
- **Body :** aucun.
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** équipe existante.
#### `GET /equipes/{{id_equipe}}/utilisateurs`
- **Token :** OUI
- **Headers :** `Authorization: Bearer {access_token}`.
- **Body :** aucun.
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** utilisateur existant, équipe existante.
#### `POST /equipes`
- **Token :** OUI
- **Headers :** `Content-Type: application/json` pour POST/PATCH avec body; `Authorization: Bearer {{access_token}}` pour toute route protégée.
- **Body JSON :**
```json
{
  "nom_equipe": "Equipe Test"
}
```
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** équipe existante.
#### `PATCH /equipes/{{id_equipe}}`
- **Token :** OUI
- **Headers :** `Content-Type: application/json` pour POST/PATCH avec body; `Authorization: Bearer {{access_token}}` pour toute route protégée.
- **Body JSON :**
```json
{
  "description": "Description modifiée"
}
```
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** équipe existante.
### Rôles
#### `GET /roles`
- **Token :** OUI
- **Headers :** `Authorization: Bearer {access_token}`.
- **Body :** aucun.
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** rôle existant.
#### `GET /roles/{{id_role}}`
- **Token :** OUI
- **Headers :** `Authorization: Bearer {access_token}`.
- **Body :** aucun.
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** rôle existant.
#### `POST /roles`
- **Token :** OUI
- **Headers :** `Content-Type: application/json` pour POST/PATCH avec body; `Authorization: Bearer {{access_token}}` pour toute route protégée.
- **Body JSON :**
```json
{
  "nom_role": "role_test"
}
```
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** rôle existant.
#### `PATCH /roles/{{id_role}}`
- **Token :** OUI
- **Headers :** `Content-Type: application/json` pour POST/PATCH avec body; `Authorization: Bearer {{access_token}}` pour toute route protégée.
- **Body JSON :**
```json
{
  "description": "Description modifiée"
}
```
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** rôle existant.
### Permissions
#### `GET /permissions`
- **Token :** OUI
- **Headers :** `Authorization: Bearer {access_token}`.
- **Body :** aucun.
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** permission existante.
#### `GET /permissions/{{id_permission}}`
- **Token :** OUI
- **Headers :** `Authorization: Bearer {access_token}`.
- **Body :** aucun.
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** permission existante.
#### `POST /permissions`
- **Token :** OUI
- **Headers :** `Content-Type: application/json` pour POST/PATCH avec body; `Authorization: Bearer {{access_token}}` pour toute route protégée.
- **Body JSON :**
```json
{
  "code_permission": "EXEMPLE_CODE",
  "nom_permission": "Permission exemple"
}
```
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** permission existante.
#### `PATCH /permissions/{{id_permission}}`
- **Token :** OUI
- **Headers :** `Content-Type: application/json` pour POST/PATCH avec body; `Authorization: Bearer {{access_token}}` pour toute route protégée.
- **Body JSON :**
```json
{
  "description": "Description modifiée"
}
```
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** permission existante.
### Rôle-permission
#### `GET /roles/{{id_role}}/permissions`
- **Token :** OUI
- **Headers :** `Authorization: Bearer {access_token}`.
- **Body :** aucun.
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** rôle existant, permission existante.
#### `POST /roles/{{id_role}}/permissions`
- **Token :** OUI
- **Headers :** `Content-Type: application/json` pour POST/PATCH avec body; `Authorization: Bearer {{access_token}}` pour toute route protégée.
- **Body JSON :**
```json
{
  "id_permission": {{id_permission}}
}
```
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** rôle existant, permission existante.
#### `DELETE /roles/{{id_role}}/permissions/{{id_permission}}`
- **Token :** OUI
- **Headers :** `Authorization: Bearer {access_token}`.
- **Body :** aucun.
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** rôle existant, permission existante.
### Projets
#### `GET /projets/{{id_projet}}/participants`
- **Token :** OUI
- **Headers :** `Authorization: Bearer {access_token}`.
- **Body :** aucun.
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** projet existant, utilisateur et projet existants.
#### `POST /projets/{{id_projet}}/participants`
- **Token :** OUI
- **Headers :** `Content-Type: application/json` pour POST/PATCH avec body; `Authorization: Bearer {{access_token}}` pour toute route protégée.
- **Body JSON :**
```json
{
  "id_utilisateur": {{id_utilisateur}}
}
```
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** projet existant, utilisateur et projet existants.
#### `PATCH /projets/{{id_projet}}/participants/{{id_utilisateur}}`
- **Token :** OUI
- **Headers :** `Content-Type: application/json` pour POST/PATCH avec body; `Authorization: Bearer {{access_token}}` pour toute route protégée.
- **Body JSON :**
```json
{
  "statut": "ACTIF"
}
```
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** utilisateur existant, projet existant, utilisateur et projet existants.
#### `POST /projets`
- **Token :** OUI
- **Headers :** `Content-Type: application/json` pour POST/PATCH avec body; `Authorization: Bearer {{access_token}}` pour toute route protégée.
- **Body JSON :**
```json
{
  "id_equipe": {{id_equipe}},
  "id_chef_projet": {{id_utilisateur}},
  "nom_projet": "Projet Test",
  "code_projet": "PRJ-TEST",
  "date_debut": "2026-09-29",
  "date_fin_prevue": "2026-10-29"
}
```
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** projet existant.
#### `GET /projets`
- **Token :** OUI
- **Headers :** `Authorization: Bearer {access_token}`.
- **Body :** aucun.
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** projet existant.
#### `GET /projets/{{id_projet}}`
- **Token :** OUI
- **Headers :** `Authorization: Bearer {access_token}`.
- **Body :** aucun.
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** projet existant.
#### `PATCH /projets/{{id_projet}}`
- **Token :** OUI
- **Headers :** `Content-Type: application/json` pour POST/PATCH avec body; `Authorization: Bearer {{access_token}}` pour toute route protégée.
- **Body JSON :**
```json
{
  "description": "Description modifiée"
}
```
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** projet existant.
### Tâches
#### `GET /taches/{{id_tache}}`
- **Token :** OUI
- **Headers :** `Authorization: Bearer {access_token}`.
- **Body :** aucun.
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** tâche existante.
#### `PATCH /taches/{{id_tache}}`
- **Token :** OUI
- **Headers :** `Content-Type: application/json` pour POST/PATCH avec body; `Authorization: Bearer {{access_token}}` pour toute route protégée.
- **Body JSON :**
```json
{
  "titre": "Tâche modifiée"
}
```
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** tâche existante.
#### `PATCH /taches/{{id_tache}}/etat`
- **Token :** OUI
- **Headers :** `Content-Type: application/json` pour POST/PATCH avec body; `Authorization: Bearer {{access_token}}` pour toute route protégée.
- **Body JSON :**
```json
{
  "etat": "EN_COURS"
}
```
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** tâche existante.
#### `PATCH /taches/{{id_tache}}/terminer`
- **Token :** OUI
- **Headers :** `Content-Type: application/json` pour POST/PATCH avec body; `Authorization: Bearer {{access_token}}` pour toute route protégée.
- **Body JSON :** voir le DTO correspondant dans `src/**/dto/`; la validation globale rejette les champs non prévus.
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** tâche existante.
#### `POST /taches/{{id_tache}}/transfert`
- **Token :** OUI
- **Headers :** `Content-Type: application/json` pour POST/PATCH avec body; `Authorization: Bearer {{access_token}}` pour toute route protégée.
- **Body JSON :**
```json
{
  "nouveau_responsable": {{id_utilisateur}},
  "nouvelle_equipe": {{id_equipe}},
  "utilisateur_transfert": {{id_utilisateur}},
  "motif": "Réaffectation"
}
```
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** tâche existante.
#### `GET /taches/{{id_tache}}/transferts`
- **Token :** OUI
- **Headers :** `Authorization: Bearer {access_token}`.
- **Body :** aucun.
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** tâche existante.
### Activités
#### `GET /taches/{{id_tache}}/activites`
- **Token :** OUI
- **Headers :** `Authorization: Bearer {access_token}`.
- **Body :** aucun.
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** tâche existante.
#### `POST /taches/{{id_tache}}/activites`
- **Token :** OUI
- **Headers :** `Content-Type: application/json` pour POST/PATCH avec body; `Authorization: Bearer {{access_token}}` pour toute route protégée.
- **Body JSON :**
```json
{
  "id_utilisateur": {{id_utilisateur}},
  "temps_passe": 1
}
```
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** tâche existante.
### Commentaires
#### `GET /taches/{{id_tache}}/commentaires`
- **Token :** OUI
- **Headers :** `Authorization: Bearer {access_token}`.
- **Body :** aucun.
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** tâche existante.
#### `POST /taches/{{id_tache}}/commentaires`
- **Token :** OUI
- **Headers :** `Content-Type: application/json` pour POST/PATCH avec body; `Authorization: Bearer {{access_token}}` pour toute route protégée.
- **Body JSON :**
```json
{
  "id_utilisateur": {{id_utilisateur}},
  "contenu": "Commentaire de test"
}
```
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** tâche existante.
#### `PATCH /taches/commentaires/{{id_commentaire}}`
- **Token :** OUI
- **Headers :** `Content-Type: application/json` pour POST/PATCH avec body; `Authorization: Bearer {{access_token}}` pour toute route protégée.
- **Body JSON :**
```json
{
  "contenu": "Commentaire modifié"
}
```
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** tâche existante.
### Pièces jointes
#### `GET /taches/{{id_tache}}/pieces-jointes`
- **Token :** OUI
- **Headers :** `Authorization: Bearer {access_token}`.
- **Body :** aucun.
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** tâche existante.
#### `POST /taches/{{id_tache}}/pieces-jointes`
- **Token :** OUI
- **Headers :** `Content-Type: application/json` pour POST/PATCH avec body; `Authorization: Bearer {{access_token}}` pour toute route protégée.
- **Body JSON :**
```json
{
  "id_utilisateur": {{id_utilisateur}},
  "nom_fichier": "test.txt",
  "chemin_fichier": "uploads/test.txt"
}
```
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** tâche existante.
#### `GET /taches/commentaires/{{id_tache}}/pieces-jointes`
- **Token :** OUI
- **Headers :** `Authorization: Bearer {access_token}`.
- **Body :** aucun.
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** tâche existante.
### Notifications
#### `GET /notifications/utilisateur/{{id_utilisateur}}`
- **Token :** OUI
- **Headers :** `Authorization: Bearer {access_token}`.
- **Body :** aucun.
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** utilisateur existant.
#### `POST /notifications`
- **Token :** OUI
- **Headers :** `Content-Type: application/json` pour POST/PATCH avec body; `Authorization: Bearer {{access_token}}` pour toute route protégée.
- **Body JSON :**
```json
{
  "id_utilisateur": {{id_utilisateur}},
  "type": "INFO",
  "message": "Notification de test"
}
```
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** backend démarré.
#### `PATCH /notifications/{{id_notification}}/lire`
- **Token :** OUI
- **Headers :** `Content-Type: application/json` pour POST/PATCH avec body; `Authorization: Bearer {{access_token}}` pour toute route protégée.
- **Body JSON :** voir le DTO correspondant dans `src/**/dto/`; la validation globale rejette les champs non prévus.
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** backend démarré.
#### `PATCH /notifications/{{id_notification}}/non-lire`
- **Token :** OUI
- **Headers :** `Content-Type: application/json` pour POST/PATCH avec body; `Authorization: Bearer {{access_token}}` pour toute route protégée.
- **Body JSON :** voir le DTO correspondant dans `src/**/dto/`; la validation globale rejette les champs non prévus.
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** backend démarré.
### Historique
#### `GET /taches/{{id_tache}}/historique`
- **Token :** OUI
- **Headers :** `Authorization: Bearer {access_token}`.
- **Body :** aucun.
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** tâche existante.
#### `POST /taches/{{id_tache}}/historique`
- **Token :** OUI
- **Headers :** `Content-Type: application/json` pour POST/PATCH avec body; `Authorization: Bearer {{access_token}}` pour toute route protégée.
- **Body JSON :**
```json
{
  "id_utilisateur": {{id_utilisateur}},
  "action": "TEST"
}
```
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** tâche existante.
### Rapports
#### `GET /rapports`
- **Token :** OUI
- **Headers :** `Authorization: Bearer {access_token}`.
- **Body :** aucun.
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** backend démarré.
#### `GET /rapports/utilisateur/{{id_utilisateur}}`
- **Token :** OUI
- **Headers :** `Authorization: Bearer {access_token}`.
- **Body :** aucun.
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** utilisateur existant.
#### `GET /rapports/{{id_rapport}}`
- **Token :** OUI
- **Headers :** `Authorization: Bearer {access_token}`.
- **Body :** aucun.
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** backend démarré.
#### `POST /rapports`
- **Token :** OUI
- **Headers :** `Content-Type: application/json` pour POST/PATCH avec body; `Authorization: Bearer {{access_token}}` pour toute route protégée.
- **Body JSON :**
```json
{
  "id_utilisateur": {{id_utilisateur}},
  "type": "ACTIVITE",
  "format": "PDF"
}
```
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** backend démarré.
### Sessions
#### `GET /sessions/utilisateur/{{id_utilisateur}}`
- **Token :** OUI
- **Headers :** `Authorization: Bearer {access_token}`.
- **Body :** aucun.
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** utilisateur existant, session existante et active pour les opérations protégées.
#### `PATCH /sessions/{{id_session}}/fermer`
- **Token :** OUI
- **Headers :** `Content-Type: application/json` pour POST/PATCH avec body; `Authorization: Bearer {{access_token}}` pour toute route protégée.
- **Body JSON :** voir le DTO correspondant dans `src/**/dto/`; la validation globale rejette les champs non prévus.
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** session existante et active pour les opérations protégées.
### Racine
#### `GET /`
- **Token :** OUI
- **Headers :** `Authorization: Bearer {access_token}`.
- **Body :** aucun.
- **Résultat attendu :** réponse JSON correspondant à la ressource; `200` pour les lectures/modifications et `201` pour les créations lorsque NestJS applique le statut par défaut.
- **Erreurs possibles :** `400`, `401`, `403`, `404`, `409`, `500` selon la validation, l'authentification et l'état de la ressource.
- **Dépendances :** backend démarré.
## 6. Tests de sécurité
### A — Sans token
Appeler une route protégée, par exemple `GET /utilisateurs`, sans `Authorization`.

Attendu : `401 Unauthorized`.

### B — Token incorrect
Envoyer `Authorization: Bearer faux-token`.

Attendu : `401 Unauthorized`.

### C — Token expiré
Utiliser un JWT dont la durée de vie est dépassée.

Attendu : `401 Unauthorized`.

### D — Session fermée
1. Se connecter.
2. Exécuter `POST /auth/logout`.
3. Réutiliser le même `access_token`.

Attendu : `401 Unauthorized`, car le guard vérifie également la session PostgreSQL.

### E — Permission insuffisante
Les guards `RolesGuard` et `PermissionsGuard` sont disponibles pour les routes décorées avec `@Roles(...)` et `@Permissions(...)`. Le ZIP de référence ne contenait pas de mapping fiable endpoint → `code_permission`, donc aucun code arbitraire n'a été imposé aux routes existantes. Une route décorée avec un code existant doit retourner `403` lorsque l'utilisateur ne possède pas ce code.
## 7. Remarques sur les IDs
Les variables `{{id_utilisateur}}`, `{{id_projet}}`, `{{id_tache}}`, `{{id_equipe}}`, `{{id_session}}`, etc. sont des placeholders Postman. Elles ne constituent pas des IDs de la base. Utiliser les valeurs réellement retournées par votre PostgreSQL.
## 8. Collection
Le fichier `OPQUAL-API.postman_collection.json` contient les 64 routes détectées dans les contrôleurs du ZIP, y compris les routes supplémentaires réellement présentes mais absentes de la liste initiale (par exemple `POST /taches/:id/historique`, `GET /rapports/utilisateur/:id` et `GET /taches/commentaires/:id/pieces-jointes`).
