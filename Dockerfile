# FROM node:20-alpine

# WORKDIR /app

# # Install dependencies
# COPY package*.json ./
# RUN npm install

# # Copy source code
# COPY . .


# # ✅ Generate Prisma client
# RUN npx prisma generate

# # 🔥 Build TypeScript
# RUN npm run build

# # Expose port
# EXPOSE 5000

# # Start compiled app
# # CMD ["node", "dist/server.js"]
# CMD sh -c "npx prisma migrate deploy && node --loader ts-node/esm src/scripts/seed-admin.ts && node dist/server.js"


FROM node:20-slim

WORKDIR /app

# Install system dependencies required by canvas
RUN apt-get update && apt-get install -y \
  python3 \
  make \
  g++ \
  libcairo2-dev \
  libpango1.0-dev \
  libjpeg-dev \
  libgif-dev \
  librsvg2-dev \
  && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

EXPOSE 5000

CMD sh -c "npx prisma migrate deploy && node --loader ts-node/esm src/scripts/seed-admin.ts && node dist/server.js"
