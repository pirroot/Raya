# Next/Dockerfile
FROM node:22-bookworm-slim AS deps
WORKDIR /app

# کپی package.json برای نصب وابستگی‌ها
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# نصب pnpm و وابستگی‌ها
RUN npm install -g pnpm && pnpm install --frozen-lockfile

FROM node:22-bookworm-slim AS build
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

# آرگومان‌های محیطی برای بیلد
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_MESSENGER_API_BASE_URL
ARG NEXT_PUBLIC_MARKET_API_BASE_URL

# ست کردن متغیرهای محیطی
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_PUBLIC_MESSENGER_API_BASE_URL=${NEXT_PUBLIC_MESSENGER_API_BASE_URL}
ENV NEXT_PUBLIC_MARKET_API_BASE_URL=${NEXT_PUBLIC_MARKET_API_BASE_URL}

# کپی node_modules از مرحله قبل
COPY --from=deps /app/node_modules ./node_modules

# کپی کل پروژه
COPY . .

# بیلد کردن
RUN pnpm build

# حذف وابستگی‌های توسعه
RUN pnpm prune --prod

FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# کپی فایل‌های مورد نیاز
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package*.json ./

# ایجاد کاربر غیر روت
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

EXPOSE 3000

CMD ["node", "node_modules/next/dist/bin/next", "start", "--port", "3000", "--hostname", "0.0.0.0"]
