# Étape 1: Build de l'application React
FROM node:18-alpine AS build

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier tout le code source
COPY . .

# Construire l'application (créer le dossier build/)
RUN npm run build

# Étape 2: Servir l'application avec Nginx
FROM nginx:alpine

# Copier les fichiers buildés depuis l'étape précédente
COPY --from=build /app/build /usr/share/nginx/html

# Copier une configuration Nginx personnalisée (optionnel)
COPY nginx.conf /etc/nginx/nginx.conf

# Exposer le port 82
EXPOSE 82

# Démarrer Nginx
CMD ["nginx", "-g", "daemon off;"]