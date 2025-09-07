FROM node:22.2.0-alpine AS development

WORKDIR ./app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

FROM development AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR ./app

COPY package*.json ./
RUN npm ci
COPY . .
COPY --from=development ./app/dist ./dist

EXPOSE 3000
CMD ["npm", "run", "start"]
