# OPQUAL Performance — Frontend

Interface web du **Groupe OPQUAL** (« Plateforme de pilotage de la performance »).
React + JavaScript + Vite + React Router, sans autre dépendance. Elle communique uniquement avec l'API REST du backend NestJS existant (`backendopqual`), qui reste inchangé.

## Installation

```bash
npm install
cp .env.example .env     # puis vérifier l'URL du backend
npm run dev              # http://localhost:5173
npm run build            # production → dossier dist/
```

`.env` :

```
VITE_API_URL=http://localhost:3000
```

Le backend NestJS doit être lancé séparément (`npm run start:dev` dans `backend`). Son CORS autorise `http://localhost:5173`. Aucun secret (JWT_SECRET, DATABASE_URL…) n'est utilisé ici.

## Structure

```
src/
  api/        client.js (fetch centralisé : Bearer, 401, erreurs) + un fichier par module backend
  components/ composants réutilisables (ui, graphiques SVG, modales, icônes)
  config/     valeurs.js (états/priorités), api.js
  context/    Auth (session JWT), Theme, Données partagées, Toasts
  hooks/      useFetch, useTableau, usePeriode, useActivites, useInactivite
  layouts/    AppLayout (sidebar + header + notifications)
  pages/      une page par écran
  routes/     ProtectedRoute
  styles/     styles.css (design system OPQUAL, thèmes clair/sombre)
  utils/      format, stats, access
```

## Points d'attention (à lire)

1. **États et priorités** — le backend ne les déclare pas dans son code (contraintes CHECK PostgreSQL). Les valeurs proposées sont dans `src/config/valeurs.js`. Seules `A_FAIRE`, `EN_COURS`, `PLANIFIE`, `NORMALE`, `ACTIF`, `INACTIF`, `ACTIVE/INACTIVE/ARCHIVEE` sont confirmées. Vérifiez les autres avec `\d construct.tache` et `\d construct.projet` dans psql et corrigez le fichier si besoin. Les valeurs déjà présentes en base sont ajoutées automatiquement aux filtres.
2. **Pas de sécurité par rôle côté backend** — il authentifie (JWT + session) mais n'applique aucun `@Roles`/`@Permissions`. Le frontend masque seulement les actions selon le nom du rôle (`utils/access.js`, recherche « admin », « manager », « chef »). Ce n'est pas une protection.
3. **Statistiques** — le backend n'a pas d'API de statistiques. Les KPI et graphiques sont calculés dans le navigateur à partir des listes réelles (projets, tâches, activités). Pas d'objectifs chiffrés : le backend n'en gère pas.
4. **Pièces jointes** — le backend n'enregistre que les métadonnées (nom, chemin/lien, type, taille), pas le fichier.
5. **Exports** — CSV généré dans le navigateur (puis tracé via `POST /rapports`). Le backend ne génère pas de PDF.
6. **Historique** — le backend ne l'alimente pas lors d'un changement d'état ou d'un transfert ; le frontend ajoute lui-même une ligne via `POST /taches/:id/historique` (désactivable : `HISTORIQUE_AUTO` dans `valeurs.js`).
7. **Inactivité** — avertissement après 6 minutes, déconnexion (`POST /auth/logout`) une minute plus tard. Le backend ne gère pas l'inactivité lui-même.
8. **Création de compte** — le backend n'a pas d'inscription publique (`POST /utilisateurs` est protégé) : il n'y a pas de lien « Créer un compte » ; les comptes sont créés par un administrateur (page Collaborateurs). « Mot de passe oublié ? » : pas d'API, un message renvoie vers l'administrateur.
9. Le backend n'a pas de route « utilisateur connecté » : après le login, le profil est chargé avec `GET /utilisateurs/:id` et `GET /roles/:id`.
