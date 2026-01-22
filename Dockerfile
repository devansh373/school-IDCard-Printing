# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
  python3 \
  make \
  g++ \
  libcairo2-dev \
  libpango1.0-dev \
  libjpeg-dev \
  libgif-dev \
  librsvg2-dev \
  openssl \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm install

# Copy Prisma schema first for client generation
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source code
COPY . .

# Build the TypeScript project
RUN npm run build

# Prune dev dependencies
RUN npm prune --production

# Stage 2: Production
FROM node:20-slim

# Install tini for signal handling and runtime-only system dependencies for canvas
RUN apt-get update && apt-get install -y \
  tini \
  libcairo2 \
  libpango-1.0-0 \
  libjpeg62-turbo \
  libgif7 \
  librsvg2-2 \
  openssl \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Set to production
ENV NODE_ENV=production

# Copy only what's needed from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/templates ./src/templates
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Change ownership to non-root user
RUN chown -R node:node /app

# Use non-root user for security
USER node

# Expose the application port
EXPOSE 5055

# Use tini as entrypoint to handle signals correctly
ENTRYPOINT ["/usr/bin/tini", "--"]

# Start-up command: 
# 1. Run migrations
# 2. Seed admin (compiled version)
# 3. Start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/scripts/seed-admin.js && node dist/server.js"]
