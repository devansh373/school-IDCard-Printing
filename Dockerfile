# # Stage 1: Build
# FROM node:20-slim AS builder

# WORKDIR /app

# # Install system dependencies
# RUN apt-get update && apt-get install -y \
#   python3 \
#   make \
#   g++ \
#   libcairo2-dev \
#   libpango1.0-dev \
#   libjpeg-dev \
#   libgif-dev \
#   librsvg2-dev \
#   openssl \
#   ca-certificates \
#   && rm -rf /var/lib/apt/lists/*

# # Copy package files
# COPY package*.json ./

# # Install all dependencies (including devDependencies for build)
# RUN npm install

# # Copy Prisma schema first for client generation
# COPY prisma ./prisma/

# # Copy source code
# COPY . .

# # Build the TypeScript project
# RUN npm run build

# RUN npx prisma generate
# # Prune dev dependencies
# RUN npm prune --production


# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app

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

COPY package*.json ./
RUN npm install

COPY prisma ./prisma/
COPY . .

# 1️⃣ Generate Prisma client first so TypeScript can find the types
RUN npx prisma generate

# 2️⃣ Build the project
RUN npm run build

# 3️⃣ Prune dev deps
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
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/src/templates ./src/templates

# Change ownership to non-root user
RUN chown -R node:node /app

# Use non-root user for security
USER node

# Expose the application port (matching the PORT in .env or default 5000)
EXPOSE 5000

# Use tini as entrypoint to handle signals correctly
ENTRYPOINT ["/usr/bin/tini", "--"]

# Start-up command: 
# 1. Run migrations
# 2. Start server
# Note: Seed script should be run manually in production with proper credentials
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
