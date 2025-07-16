# --- Этап 1: Сборка приложения ---
FROM node:22.17.0-alpine AS build

# Устанавливаем системные зависимости
RUN apk add --no-cache libc6-compat

# Устанавливаем Yarn
WORKDIR /app
RUN corepack enable && corepack prepare yarn@4.9.1 --activate

# Копируем package.json, устанавливаем ВСЕ зависимости
# (включая devDependencies и tsconfig-paths)
COPY package.json yarn.lock* .yarnrc.yml* ./
RUN yarn install --immutable

# Копируем остальной код
COPY . .

# Генерируем клиент Prisma и собираем проект
RUN yarn prisma generate

# Сборка проекта
RUN yarn build

# ---
# Этап 2: Финальный образ для production ---
FROM node:22.17.0-alpine AS production

ENV NODE_ENV=production
WORKDIR /app

# Устанавливаем системные зависимости
RUN apk add --no-cache libc6-compat

# Активируем нужную версию Yarn
RUN corepack enable && corepack prepare yarn@4.9.1 --activate

# Копируем только необходимые для production-установки файлы
COPY --from=build /app/package.json /app/yarn.lock* /app/.yarnrc.yml* ./
COPY --from=build /app/.yarn ./.yarn

# Устанавливаем ТОЛЬКО production-зависимости
# tsconfig-paths будет установлен, так как он в 'dependencies'
RUN yarn workspaces focus --all --production

# Копируем собранный код, tsconfig для путей и сгенерированный клиент Prisma
COPY --from=build /app/dist ./dist
COPY --from=build /app/tsconfig.json ./tsconfig.json
# ✅ ИСПРАВЛЕНИЕ: Копируем всю папку prisma, так как generated теперь внутри нее
COPY --from=build /app/prisma ./prisma

# ✅ Запускаем приложение через tsconfig-paths/register, чтобы Node.js понимал пути
CMD ["node", "dist/main.js"]