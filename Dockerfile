# Utiliser une image Node.js légère comme base
FROM node:18-alpine as builder

# Définir le répertoire de travail
WORKDIR ./

# Copier package.json et package-lock.json (ou yarn.lock)
COPY package*.json ./

# Installer les dépendances du projet de façon reproductible
# `npm ci` est recommandé dans les images de build (installe exactement les versions du lockfile)
RUN npm ci --silent --no-audit --progress=false

# Copier le reste du code de l'application
COPY . .

# Construire l'application pour la production
RUN npm run build

# ---------- Étape de production ----------
FROM nginx:alpine

# Copier les fichiers de build de l'image précédente
#COPY --from=builder ..

# Exposer le port 80 pour le serveur Nginx
EXPOSE 80

# Lancer le serveur Nginx
CMD ["nginx", "-g", "daemon off;"]
