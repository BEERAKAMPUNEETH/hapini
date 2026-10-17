# ==============================================================================
# Multi-stage Dockerfile for Hapini Backend API
# ==============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

# Security: Run as non-root node user
USER node

EXPOSE 5000

# Self-contained container health check hitting Express /api/health endpoint
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "const http=require('http');http.get('http://127.0.0.1:5000/api/health',(r)=>{process.exit(r.statusCode===200?0:1);}).on('error',()=>process.exit(1));"

CMD ["node", "dist/index.js"]
