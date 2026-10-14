# OPQUAL Performance — Rapport d'audit et de corrections

Base PostgreSQL : `opqual` — schéma : `construct`.
**Aucune modification de la base** : `schema.prisma` n'a pas été touché, aucune migration, aucun `db push`, aucun type changé (BigInt conservé).

> Limite : ce livrable a été produit sans pouvoir exécuter `npm install`, `npm run build` ni les tests
> (pas de `node_modules`, réseau désactivé). Seule une vérification statique de la syntaxe a été faite.
> **Lancez les commandes de la section D avant toute mise en production.**

## A. Erreurs trouvées

| Gravité | Fichier | Erreur | Cause |
|---|---|---|---|
| Critique | tous les `*.controller.ts` | Aucun `@Roles` / `@Permissions` posé : un COLLABORATEUR pouvait créer des rôles, utilisateurs, changer `id_role`… via Postman | Guards branchés mais jamais appliqués |
| Critique | `tache.controller.ts`, `transfert-tache.dto.ts` | `utilisateur_transfert` fourni par le client | Identité non lue depuis le JWT |
| Critique | `app.service.ts` | `GET /` (route publique avant correction) renvoyait **tous les utilisateurs, mots de passe hachés compris** | `findMany()` sans `omit` |
| Haute | `tache.service.ts` | Aucun historique écrit côté serveur | Historique délégué au frontend |
| Haute | `tache.controller.ts` | `etat` non validé (500 PostgreSQL) | Pas de DTO |
| Haute | `tache.service.ts` (`update`) | `etat = TERMINE` sans `date_terminaison` | Logique dupliquée |
| Haute | commentaires / activités / pièces jointes / rapports / historique | `id_utilisateur` pris dans le corps : usurpation d'identité | Identité non lue depuis le JWT |
| Haute | `session.controller.ts` | Lister / fermer les sessions d'un autre utilisateur | Pas de contrôle de propriétaire |
| Haute | `notification`, `commentaire` | Marquer lue / modifier la ressource d'autrui | Pas de contrôle de propriétaire |
| Haute | `auth.controller.ts` | Logout fermait la session désignée par le **corps** de la requête, pas celle du token | `id_session` fourni par le client |
| Haute | `AuthContext.jsx` | Erreur de `POST /auth/logout` ignorée en silence (session serveur restée ACTIVE) | `catch {}` vide |
| Moyenne | `jwt.strategy.ts` | Inactivité non appliquée côté serveur ; un `UPDATE session` par requête | Pas de contrôle de `derniere_activite` |
| Moyenne | `main.ts` / filtre | Erreurs 500 non journalisées | Filtre minimal branché |
| Moyenne | `auth/guards/*`, `auth/decorators/*`, `common/filters/*` | Doublons non branchés avec des règles différentes | Itérations successives |
| Basse | DTO login/logout, `package.json` | Style, noms `backend` / NOVATECH | — |

## B. Corrections effectuées

| Fichier | Modification |
|---|---|
| `common/security/role-utils.ts` (nouveau) | `normalizeRole`, `aRole`, `actorId` (identité = JWT), listes de rôles |
| `common/security/current-user.decorator.ts` (nouveau) | `@CurrentUser()` |
| `common/security/roles.decorator.ts`, `roles.guard.ts` | Normalisation des rôles + `@AllowSelf('id')` (version unifiée) |
| `common/security/jwt.strategy.ts` | Inactivité serveur (`SESSION_INACTIVITY_MINUTES`, défaut 10), message « token expiré », écriture de `derniere_activite` limitée à 1 fois / 30 s |
| `common/security/prisma-exception.filter.ts` | Journalisation des erreurs 500, `PrismaClientValidationError` → 400 |
| `auth/auth.controller.ts`, `auth.service.ts` | `POST /auth/logout` ferme **la session du token** (aucun corps). `auth/dto/logout.dto.ts` supprimé (devenu inutilisé) |
| `session/*` | Lecture : soi-même ou administrateur ; fermeture : propriétaire ou administrateur |
| `tache/*` | DTO `ChangerEtatDto` (A_FAIRE / EN_COURS / TERMINE), `@Roles` de gestion, état modifiable par le responsable de la tâche ou un rôle de gestion, historique **dans la même transaction** (création, modification, changement d'état, terminaison, transfert), `date_terminaison` cohérente, auteur du transfert lu dans le JWT |
| `utilisateur/*` | Création / modification / (dés)activation : administrateur et manager ; un utilisateur simple ne modifie que son profil (nom, prénom, email, mot de passe, téléphone, poste, thème) ; seul un administrateur touche un compte administrateur ou attribue ce rôle |
| `role`, `permission`, `role-permission`, `entreprise` | Écritures : administrateur |
| `equipe`, `projet`, `participation-projet` | Écritures : administrateur, manager, chef de projet |
| `notification`, `rapport`, `commentaire`, `activite`, `piece-jointe`, `historique-tache` | Identité depuis le JWT, contrôle de propriétaire, listes globales réservées aux rôles de gestion |
| `app.service.ts`, `app.controller.ts` | `GET /` public ne renvoie plus que « Hello World! » |
| Specs | Réécrits sans injection Nest (incompatible avec vitest) ; nouveaux tests : rôles, guard, logout, inactivité, tâches, utilisateurs |
| Frontend `authApi.js`, `client.js`, `AuthContext.jsx` | Logout sans corps ; un 401 au logout n'est plus traité comme « session expirée » ; avertissement si le serveur n'a pas confirmé ; synchronisation entre onglets |
| Frontend `useInactivite.js`, `AppLayout.jsx` | Battement (au plus toutes les 2 min d'activité) pour que le serveur connaisse l'activité réelle |
| Frontend `TacheDetail.jsx`, `TransfertModal.jsx`, `tacheApi.js`, `valeurs.js` | Plus d'écriture d'historique côté React ; plus d'`utilisateur_transfert` |
| Renommage | NOVATECH → OPQUAL (docs, Postman, `.env.example`, `package.json`) ; `DATABASE_URL=…/opqual?schema=construct` |

## C. Logout

**Mécanisme** : le JWT est signé (1 h) et son hash SHA-256 est enregistré dans `session.token_hash` (statut `ACTIVE`). À chaque requête, `JwtStrategy` exige une session `ACTIVE`, du bon utilisateur, non inactive.
**Logout** : `POST /auth/logout` avec `Authorization: Bearer <jwt>` passe la session de ce token à `FERMEE` (+ `date_deconnexion`). Tout appel suivant avec ce JWT reçoit **401**.
**Causes probables de l'ancien dysfonctionnement** : id de session pris dans le corps, erreur de logout avalée côté React, aucune limite d'inactivité côté serveur. Ces trois points sont corrigés ; **le correctif n'est validé qu'après vos tests ci-dessous.**

## D. Commandes de test

Backend :
```
cd backend
npm install
npx prisma generate
npm run build
npm run test
npm run test:e2e      # nécessite .env + PostgreSQL démarré
```
Frontend :
```
cd frontend
npm install
npm run build
```

## E. Checklist Postman (collection `OPQUAL-API.postman_collection.json`)

1. **Login** : `POST /auth/login` → copier `access_token` et `id_session`.
2. **Route protégée** : `GET /taches` avec le token → 200.
3. **Sans token** : `GET /taches` → 401.
4. **Logout** : `POST /auth/logout` avec le token (pas de corps) → 200, `session_fermee: true`.
5. **Ancien token** : refaire `GET /taches` avec le même token → **401**.
6. **Frontend** : bouton « Se déconnecter » → retour `/login`, `localStorage` vidé (`opqual_session`), aucun utilisateur affiché, retour arrière du navigateur → redirigé vers `/login`.
7. **Inactivité** : laisser 6 min → avertissement ; +1 min → déconnexion ; `session.statut = 'FERMEE'` en base.
8. **Rôles** (avec un token COLLABORATEUR) : `POST /roles`, `POST /utilisateurs`, `PATCH /utilisateurs/{autre}`, `POST /projets`, `POST /taches`, `POST /taches/:id/transfert` → **403** ; `PATCH /utilisateurs/{soi}` avec `{"id_role": 1}` → **403** ; `{"theme": "sombre"}` → 200.
9. **Rôles** (MANAGER) : créer projet / tâche → OK ; attribuer le rôle administrateur → 403.
10. **Tâches** : `PATCH /taches/:id/etat` `{"etat":"INVALIDE"}` → 400 ; état valide par le responsable → 200 ; par un autre collaborateur → 403.
11. **Historique** : après changement d'état, création et transfert, `GET /taches/:id/historique` contient les lignes `CHANGEMENT_ETAT`, `TACHE_CREEE`, `TACHE_TRANSFEREE`.
12. **Transfert** : `POST /taches/:id/transfert` sans `utilisateur_transfert` → 201 ; `GET /taches/:id/transferts` → `utilisateur_transfert` = utilisateur du token.
13. **Usurpation** : `POST /taches/:id/commentaires` avec `id_utilisateur` d'un autre → 403.

## F. Points à vérifier chez vous

- **Noms de rôles** : les `@Roles` utilisent `administrateur`, `manager`, `chef de projet`, comparés après normalisation (casse, accents, espaces, `_`, alias `ADMIN`, `CHEF_PROJET`). Vérifiez `SELECT nom_role FROM construct.role;`. Si vos noms diffèrent, ajustez `role-utils.ts` seulement.
- **Permissions** : aucun `@Permissions` n'a été posé, car les codes réels de `permission.code_permission` n'étaient pas connus. `PermissionsGuard` reste prêt.
- **États de tâche** : `A_FAIRE`, `EN_COURS`, `TERMINE` (`tache-etat.ts`). Si votre CHECK en autorise d'autres, ajoutez-les là.
- **Fichiers dupliqués non supprimés** (inutilisés, à retirer après votre accord) : `src/auth/guards/*`, `src/auth/decorators/*`, `src/auth/auth-user.interface.ts`, `src/common/filters/*`, dossier `backend/generated/` (la version utilisée est `src/generated/`).
- `BigInt.toJSON` renvoie toujours un `Number` (`main.ts`) : à garder tel quel tant que vos ids restent < 2^53.

## G. Base PostgreSQL

Aucun fichier de `prisma/` n'a été modifié. Aucune table, colonne, type, clé, contrainte ou relation n'a été touché. `historique_tache`, `transfert_tache` et `session` sont utilisées avec leurs colonnes existantes.

---

## H. Mise à jour frontend (interface)

| Demande | Correction | Fichiers |
|---|---|---|
| Menu sous le nom (Paramètres / Se déconnecter) inactif | Le clic dans le menu était traité comme « extérieur » (la zone surveillée ne couvrait que les notifications) : le menu se fermait avant d'agir. Les deux zones sont maintenant prises en compte. | `layouts/AppLayout.jsx` |
| Graphique « Évolution des performances » peu lisible | Même donnée (taux de réalisation par mois) : graphique plus grand, axe adapté, valeurs affichées, dernier mois mis en avant, infobulle au survol (terminées / total), 3 indicateurs (dernier mois, moyenne, meilleur mois). Mise en page : Répartition + Évolution (large) / 3 cartes / Activités en pleine largeur. | `components/Charts.jsx`, `pages/Dashboard.jsx`, `styles/styles.css` |
| Photo de profil | Ajout / changement / suppression dans Paramètres > Compte ; recadrée en carré, affichée partout où l'avatar apparaît. **Stockée dans le navigateur** (la table `utilisateur` n'a pas de colonne photo). | `utils/photo.js`, `components/ui.jsx`, `pages/Parametres.jsx` |
| Rapports plus simples | 3 étapes : cartes à cocher (Projets, Tâches, Collaborateurs, Équipes), période en un clic (semaine, mois, trimestre, année, personnalisée), format PDF ou CSV. Historique avec re-téléchargement. PDF généré dans le navigateur (`utils/pdf.js`, sans bibliothèque). | `pages/Rapports.jsx`, `utils/pdf.js` |
| Couleurs d'état et de priorité | Une couleur par valeur (À faire gris, En cours bleu, Terminé vert, Planifié violet, Suspendu jaune ; Basse turquoise, Normale indigo, Haute orange, Urgente rouge), dans les tableaux, détails et graphiques. | `utils/couleurs.js`, `components/ui.jsx` |

Points à connaître :
- **Photo** : visible seulement sur l'appareil où elle a été ajoutée. Pour la partager entre appareils il faudrait une colonne en base (modification PostgreSQL : à valider avant).
- **Historique des rapports** : une ligne `rapport` est enregistrée par type coché (`TACHES`, `PROJETS`, `COLLABORATEURS`, `EQUIPES`) avec le format `PDF` ou `CSV`. Si une contrainte CHECK de la table `rapport` refuse une valeur (par exemple `EQUIPES`), le fichier est quand même généré, seule la ligne d'historique manque.
- **CSV à plusieurs types** : un seul fichier, un bloc par type, séparés par une ligne vide.

---

## I. Corrections du 7 octobre 2026

| Problème | Cause | Correction |
|---|---|---|
| Bouton « Désactiver » d'un participant → erreur 23514 | Le frontend envoyait `statut = 'INACTIF'`, mais la contrainte `ck_participation_projet_1` n'autorise que `ACTIF` et `RETIRE` | Le bouton envoie `RETIRE` (libellé « Retirer du projet ») ; le DTO backend valide `ACTIF` / `RETIRE` ; toute violation de contrainte CHECK renvoie maintenant une erreur 400 lisible au lieu d'un 500 |
| Changement d'état en double dans l'historique | Le trigger PostgreSQL `trg_historiser_etat_tache` écrit déjà la ligne (sans auteur) ; le backend en ajoutait une seconde | Le backend n'écrit plus de seconde ligne d'état : il renseigne l'auteur sur la ligne créée par le trigger. Création : une ligne n'est ajoutée que si la base n'en a pas déjà écrit une |
| Transferts affichés avec des identifiants | « Responsable 3500 → 4 » | L'historique indique les noms des personnes et des équipes |
| Onglet « Pièces jointes » inutile | — | Retiré de la page d'une tâche (les routes backend restent disponibles) |
| Astérisques `*` dans les formulaires | Affichées par le composant `Champ` | Supprimées partout ; la validation des champs reste identique |
| Prénom obligatoire | — | Prénom facultatif (Paramètres, Collaborateurs). La colonne `utilisateur.prenom` est NOT NULL en base : une chaîne vide est enregistrée si aucun prénom n'est saisi. Les initiales utilisent alors les 2 premières lettres du nom |

Si une contrainte CHECK de `utilisateur` interdit une chaîne vide dans `prenom`, la création ou la modification renverra une erreur 400 explicite ; dans ce cas, signalez-le avant toute modification de la base.

---

## J. Rapports : export Excel conforme au modèle

- **Nouveau format « Excel (.xlsx) »** (par défaut) : bandeau de titre, ligne « Période | Généré le … par … », en-têtes filtrables, lignes alternées, états et priorités colorés, ligne « Total : N ligne(s) », volets figés, une feuille par type de données. Fichier généré dans le navigateur par `utils/xlsx.js` (aucune bibliothèque ajoutée).
- **Colonnes de performance** (comme le modèle) : Collaborateur / Équipe → tâches attendues, réalisées, taux de réalisation, respect des délais, en retard, heures estimées. Les tâches « attendues » suivent la règle du tableau de bord (échéance ou clôture dans la période).
- **Respect des délais** : 100 % lorsqu'aucune tâche terminée avec échéance n'est à évaluer (comme dans le modèle).
- **Heures** : « Heures estimées » (somme des temps estimés) ; les heures imputées nécessiteraient de charger les activités de chaque tâche.
- **PDF** et **CSV** utilisent les mêmes colonnes. Le CSV reste un fichier de données brutes (un CSV ne peut contenir ni couleurs ni mise en forme).
- **Historique** : le format « XLSX » est enregistré, ou « EXCEL » si la base refuse le premier. Si la contrainte de la table `rapport` n'accepte ni l'un ni l'autre, le fichier est quand même généré mais la ligne d'historique manque : envoyer le résultat de la requête sur `pg_constraint` pour trancher.
- Nom de fichier : `rapport-<type>-AAAAMMJJ-HHMM.xlsx`.

---

## K. Connexion, thème sombre premium et menu masquable

- **Nom de l'application** : à modifier uniquement dans `frontend/src/config/app.js` (`NOM_APPLICATION`, `NOM_ENTREPRISE`, `SLOGAN`). Il est repris sur la page de connexion, le menu, l'onglet du navigateur et les titres des rapports.
- **Page de connexion** refaite d'après le modèle : image de chantier (`assets/login-chantier.svg`, illustration vectorielle remplaçable par une photo en gardant le même nom d'import ou en modifiant l'URL dans `styles.css`), mot de marque, 4 fonctions, carte de connexion, « Créer un compte » (information : comptes créés par l'administrateur).
- **Thème sombre premium** (bouton lune) : bleu nuit profond, cartes en verre, lueurs bleues, menu dégradé, boutons lumineux. Le mode clair est inchangé.
- **Menu de gauche masquable** (ordinateur) : bouton « ‹ » en haut du menu ; le menu devient un panneau ouvert par le bouton « hamburger » de la barre du haut (comme sur téléphone) ; bouton « épingle » pour le ré-afficher en permanence ; touche Échap pour fermer ; choix mémorisé. Visible par défaut.
