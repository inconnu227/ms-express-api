# 🖥️ MS EXPRESS — Backend API

API REST NestJS pour l'application de livraison MS Express.

## 🚀 Démarrage rapide

\`\`\`bash
# Installation
npm install

# Démarrer en mode dev (avec hot-reload)
npm run start:dev
\`\`\`

## 📖 Documentation Swagger

Une fois lancé, ouvre :
- 🎯 **Swagger UI** : http://localhost:3000/api/docs
- 📄 **OpenAPI JSON** : http://localhost:3000/api/docs-json

## 🏗️ Stack

- **NestJS** 10 — Framework Node.js
- **TypeORM** 0.3 — ORM
- **SQLite** (dev) / **PostgreSQL** (prod)
- **JWT** — Authentification
- **Swagger** — Documentation auto

## 📂 Structure

\`\`\`
ms-express-api/
├── src/
│   ├── main.ts                # Bootstrap
│   ├── app.module.ts          # Module racine
│   ├── config/                # Config (DB, JWT)
│   ├── common/                # Guards, decorators, filters
│   ├── database/              # Base de données
│   └── modules/               # Modules métier
│       ├── auth/              # Authentification
│       ├── users/             # Utilisateurs
│       ├── orders/            # Commandes
│       ├── chats/             # Conversations
│       └── ratings/           # Avis
├── data/                      # Base SQLite (auto-créée)
└── .env                       # Variables d'environnement
\`\`\`

## 🎯 Endpoints (prévus)

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/login` | Connexion |
| GET | `/api/auth/me` | Profil actuel |
| GET | `/api/users/me` | Profil utilisateur |
| PATCH | `/api/users/me` | Modifier profil |
| GET | `/api/orders` | Liste commandes |
| POST | `/api/orders` | Créer commande |
| GET | `/api/orders/:id` | Détail commande |
| PATCH | `/api/orders/:id/status` | Changer statut |
| GET | `/api/chats` | Conversations |
| POST | `/api/chats/:id/messages` | Envoyer message |
| POST | `/api/ratings` | Créer un avis |
| GET | `/api/ratings/mine` | Mes avis |

## 🔐 Authentification

L'API utilise **JWT Bearer tokens**.

\`\`\`bash
# Après login, tu reçois un accessToken
# Ajoute-le dans les headers :
Authorization: Bearer <accessToken>
\`\`\`

## 📝 Licence

Propriétaire — MS Express © 2026