# Étape 1: Build de l'application React
FROM node:18-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Étape 2: Servir l'application avec Nginx
FROM nginx:alpine

# Copier les fichiers buildés
COPY --from=build /app/build /usr/share/nginx/html

# Créer directement la configuration dans conf.d/
RUN echo 'server { \
    listen 82; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# ❌ NE PAS écraser nginx.conf
# RUN rm /etc/nginx/nginx.conf (NE PAS FAIRE)

# Exposer le port 82
EXPOSE 82

# Santé du conteneur
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://localhost:82/ || exit 1

# Démarrer Nginx
CMD ["nginx", "-g", "daemon off;"]
