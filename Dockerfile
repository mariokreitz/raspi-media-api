FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM alpine:latest

RUN apk add --no-cache nodejs npm samba-client

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules

COPY . .
RUN chmod +x /app/start.sh

EXPOSE ${PORT:-3000}

CMD ["/app/start.sh"]