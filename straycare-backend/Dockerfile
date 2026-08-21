FROM node:22-slim AS build
WORKDIR /app

COPY package*.json ./
RUN npm install --no-audit --no-fund

COPY prisma ./prisma
COPY prisma.config.ts ./
RUN DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy npx prisma generate

COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npm run build

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY package.json ./

EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]