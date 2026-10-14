# PERFIO — KPI Platform

Plateforme web de gestion et de suivi des indicateurs clés de performance (KPI), conçue pour accompagner le pilotage des activités d'une entreprise du secteur de la construction.

## Sommaire

- [Présentation](#-présentation)
- [Technologies](#-technologies)
- [Architecture](#-architecture-du-projet)
- [Prérequis](#-prérequis)
- [Configuration](#-configuration)
- [Installation avec Docker](#-1-installation-avec-docker)
- [Installation sans Docker](#-2-installation-sans-docker)
- [Sauvegarde et restauration PostgreSQL](#-sauvegarde-et-restauration-postgresql)
- [Commandes utiles](#-commandes-utiles)
- [Dépannage](#-dépannage)
- [Sécurité](#-sécurité)

---

## 📌 Présentation

Perfio est une application web Full-Stack développée dans le contexte professionnel de l'entreprise OPQUAL, dans le secteur de la construction.

La plateforme est conçue pour faciliter la gestion des activités, le suivi des indicateurs clés de performance (KPI) et l'exploitation des données nécessaires au pilotage des performances.

Elle repose sur une architecture moderne séparant l'interface utilisateur, le backend et la base de données afin de faciliter la maintenance et l'évolution de l'application.


### Objectifs

- Centraliser les données nécessaires au suivi des performances.
- Fournir une interface web pour interagir avec les fonctionnalités de l'application.
- Développer et structurer des API REST.
- Organiser les données dans une base relationnelle.
- Faciliter l'installation et l'exécution grâce à Docker Compose.

## 🛠️ Technologies

| Composant | Technologies |
|---|---|
| Frontend | React, Vite, JavaScript |
| Backend | NestJS, TypeScript |
| ORM | Prisma |
| Base de données | PostgreSQL |
| Conteneurisation | Docker, Docker Compose |
| Tests d'API | Postman |
| Documentation d'API | Swagger / OpenAPI |

## 📂 Architecture du projet

```text
OPQUAL/
├── backend/                 # API NestJS
│   ├── prisma/              # Schéma Prisma
│   ├── src/                 # Modules et logique métier
│   ├── package.json
│   └── .env                 # Configuration locale, non publiée
├── frontend/                # Interface React avec Vite
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env                 # Si nécessaire
├── docker-compose.yml       # Orchestration des services
├── .env.example             # Exemple de configuration sans secrets
├── .gitignore
└── README.md
```

*Cette arborescence est indicative : conserve la structure réellement présente dans ton dépôt.*

## 📋 Prérequis

### Pour Docker

- Windows 10/11 compatible avec Docker Desktop.
- Docker Desktop installé et démarré.
- Les fichiers du projet et le fichier `docker-compose.yml`.
- Un fichier `.env` configuré selon les variables attendues par Docker Compose.

### Pour une installation locale

- Node.js et npm.
- PostgreSQL installé et démarré sous Windows.
- Les dépendances npm du backend et du frontend.
- Les variables d'environnement configurées.
- Un accès à la base de données `opqual`.

---

## 1. 🐳 Installation avec Docker

Cette méthode permet de démarrer les services déclarés dans Docker Compose. Selon la configuration du projet, ils comprennent PostgreSQL, le backend NestJS et le frontend React.

### Étape 1 — Ouvrir PowerShell

Se placer dans le dossier du projet :

```powershell
cd "$HOME\Downloads\OPQUAL"
```

Adapte le chemin si nécessaire.

### Étape 2 — Vérifier Docker

```powershell
docker --version
docker compose version
```

Assure-toi que Docker Desktop est démarré.

### Étape 3 — Configurer les variables d'environnement

Vérifie que le fichier `.env` requis par Docker Compose existe et contient les variables attendues.

Ne publie jamais ce fichier sur GitHub lorsqu'il contient des mots de passe ou des secrets.

### Étape 4 — Démarrer les services

```powershell
docker compose up -d --build
```

Cette commande construit les images nécessaires si besoin et démarre les services en arrière-plan.

Pour démarrer ultérieurement sans reconstruire les images :

```powershell
docker compose up -d
```

### Étape 5 — Vérifier l'état des services

```powershell
docker compose ps
```

Les services attendus dans cette configuration sont :

- `opqual-postgres` : base de données PostgreSQL.
- `opqual-backend` : API NestJS.
- `opqual-frontend` : interface utilisateur.

Les noms réels affichés dépendent du fichier `docker-compose.yml`.

### Étape 6 — Accéder à l'application

| Service | Adresse |
|---|---|
| Frontend | http://localhost |
| Backend | http://localhost:3000 |

Ces adresses supposent que les ports sont configurés comme indiqué dans ce guide. Si Docker utilise d'autres ports, consulte les mappings de `docker-compose.yml`.

Si Swagger est activé, son interface de documentation sera accessible à l'URL configurée par le backend.

### Étape 7 — Consulter les logs

Backend :

```powershell
docker compose logs --tail=100 backend
```

PostgreSQL :

```powershell
docker compose logs --tail=100 postgres
```

Frontend :

```powershell
docker compose logs --tail=100 frontend
```

Tous les services :

```powershell
docker compose logs --tail=100
```

Utilise les noms de services déclarés dans le fichier Compose si ceux-ci diffèrent.

### Étape 8 — Arrêter l'application

Arrêter les conteneurs sans les supprimer :

```powershell
docker compose stop
```

Redémarrer les conteneurs arrêtés :

```powershell
docker compose start
```

Arrêter et supprimer les conteneurs du projet :

```powershell
docker compose down
```

**Attention :** évite `docker compose down -v` sans avoir vérifié et sauvegardé les données. L'option `-v` peut supprimer les volumes associés au projet et entraîner la perte des données PostgreSQL qui y sont stockées.

---

## 2. 💻 Installation sans Docker

Cette méthode permet de démarrer séparément PostgreSQL, le backend et le frontend, notamment pour le développement avec Visual Studio Code.

### Étape 1 — Démarrer PostgreSQL sous Windows

Démarre le service PostgreSQL installé sur Windows.

Tu peux ensuite ouvrir pgAdmin pour consulter la base `opqual` et le schéma `construct`.

**À retenir :** pgAdmin est un outil d'administration ; il ne démarre pas automatiquement le serveur PostgreSQL.

### Étape 2 — Configurer le backend

Dans `backend/.env`, configure les variables utilisées par l'application.

Exemple indicatif :

```env
DATABASE_URL="postgresql://UTILISATEUR:MOT_DE_PASSE@localhost:5432/opqual?schema=construct"
JWT_SECRET="REMPLACER_PAR_UN_SECRET_SECURISE"
JWT_EXPIRES_IN="1h"
```

Remplace les valeurs fictives par celles de ton environnement. Conserve également les autres variables nécessaires au backend.

Ne modifie pas arbitrairement les noms des variables : ils doivent correspondre à la configuration de ton code.

### Étape 3 — Installer et démarrer le backend

Dans un premier terminal PowerShell :

```powershell
cd "$HOME\Downloads\OPQUAL\backend"
npm install
npm run start:dev
```

La commande `npm install` est nécessaire lors de la première installation ou lorsque les dépendances doivent être actualisées.

Le backend est généralement accessible à :

http://localhost:3000

### Étape 4 — Installer et démarrer le frontend

Ouvre un deuxième terminal PowerShell :

```powershell
cd "$HOME\Downloads\OPQUAL\frontend"
npm install
npm run dev
```

Vite affiche l'adresse du frontend dans le terminal, généralement :

http://localhost:5173

### Étape 5 — Vérifier la communication

Vérifie que :

- PostgreSQL est démarré.
- Le backend se connecte correctement à la base.
- Le frontend utilise la bonne URL d'API.
- Le backend autorise l'origine du frontend avec CORS.
- L'authentification et les fonctionnalités nécessaires répondent correctement.

Si l'application utilise un fichier d'environnement spécifique pour Vite, configure également l'URL de l'API selon les variables réellement utilisées par le frontend.

---

## 3. 🗄️ Sauvegarde et restauration PostgreSQL

Une sauvegarde permet de transférer les données vers un autre ordinateur ou de restaurer une base après une réinstallation.

### Sauvegarder la base de données

Avec `pg_dump` installé et accessible depuis le terminal :

```powershell
pg_dump -h localhost -p 5432 -U UTILISATEUR -d opqual -F c -f "$HOME\Desktop\opqual_backup.dump"
```

Remplace `UTILISATEUR` par le nom réel de l'utilisateur PostgreSQL. La commande peut demander son mot de passe.

Le format personnalisé `-F c` produit une sauvegarde adaptée à `pg_restore`.

### Restaurer la sauvegarde

1. Vérifie que le serveur PostgreSQL cible est démarré.
2. Crée une base de destination vide nommée `opqual`, si elle n'existe pas.
3. Restaure le fichier avec :

```powershell
pg_restore -h localhost -p 5432 -U UTILISATEUR -d opqual "$HOME\Desktop\opqual_backup.dump"
```

Si le schéma `construct` est nécessaire, vérifie que le schéma, les extensions et les éventuels rôles requis sont présents ou recréés selon la structure de la sauvegarde.

**Important :** une sauvegarde PostgreSQL peut contenir des données personnelles et professionnelles. Garde-la dans un emplacement privé et ne la publie pas dans un dépôt public.

---

## 4. ⚡ Commandes utiles

### Docker

```powershell
docker compose up -d
docker compose ps
docker compose logs --tail=100
docker compose stop
```

### Backend NestJS

```powershell
cd backend
npm install
npm run start:dev
```

### Frontend React

```powershell
cd frontend
npm install
npm run dev
```

Les commandes `cd backend` et `cd frontend` supposent que le terminal se trouve initialement à la racine du projet.

---

## 5. 🔧 Dépannage

### Erreur de connexion PostgreSQL

Vérifie :

- Le serveur PostgreSQL utilisé.
- Le nom de la base.
- Le port.
- L'utilisateur et le mot de passe.
- L'URL de connexion dans le fichier d'environnement approprié.

Avec Docker, le nom d'hôte PostgreSQL est généralement le nom du service Compose, par exemple `postgres`, depuis le conteneur backend. Depuis Windows, il s'agit généralement de `localhost` et du port publié.

### Erreur CORS

Vérifie que l'origine autorisée par NestJS correspond à l'adresse réelle du frontend :

- Docker : `http://localhost`, si le frontend est publié sur le port 80.
- Développement Vite : `http://localhost:5173`.

Le port et l'origine doivent correspondre à la configuration réelle.

### Erreur 500 du backend

Avec Docker :

```powershell
docker compose logs --tail=100 backend
```

Sans Docker, consulte le terminal où NestJS est lancé. Vérifie notamment les erreurs Prisma, les variables d'environnement et les contraintes PostgreSQL.

### Frontend inaccessible

Avec Docker :

```powershell
docker compose ps
docker compose logs --tail=100 frontend
```

Sans Docker, consulte le terminal Vite et ouvre l'adresse indiquée.

### Données manquantes

Vérifie si le backend utilise PostgreSQL sous Windows ou PostgreSQL dans Docker. Ce sont deux instances distinctes si elles sont configurées séparément.

Pour transférer les données, restaure la sauvegarde dans l'instance cible avant de tester l'application.

---

## 6. 🔐 Sécurité et bonnes pratiques

- Ne publie pas les fichiers `.env` contenant des secrets.
- Ne partage pas les mots de passe PostgreSQL ni les clés JWT.
- Conserve un fichier `.env.example` avec des valeurs fictives.
- N'inclus pas `node_modules/` dans le dépôt Git.
- Conserve les fichiers `package-lock.json` pour faciliter l'installation reproductible.
- Effectue des sauvegardes avant les opérations de suppression ou de restauration.
- Vérifie les données présentes dans le dépôt avant chaque publication.
- Pour un environnement de production, protège les secrets et configure HTTPS.

---

## 📌 Informations du projet

**OPQUAL — KPI Platform**

*Application web Full-Stack de gestion et de suivi des indicateurs de performance.*

**Stack technique :** React · Vite · NestJS · TypeScript · Prisma · PostgreSQL · Docker Compose