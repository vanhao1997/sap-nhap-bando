FROM node:22.14-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install --include=optional

COPY . .
RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
