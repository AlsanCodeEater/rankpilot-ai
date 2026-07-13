FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat python3 make g++

COPY package.json package-lock.json ./
COPY prisma ./prisma/

RUN npm ci --include=dev
RUN npx prisma generate

COPY . .

RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]