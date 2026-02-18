# frontend/Dockerfile
# Étape 1 : Construction de l'app React
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Étape 2 : Service avec Nginx
FROM nginx:stable-alpine
# (Optionnel) Copie d'une configuration Nginx personnalisée
# COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
# Si votre build React utilise un dossier de sortie différent (ex: /app/build), ajustez la ligne ci-dessus.
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]