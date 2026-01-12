FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# ✅ Generate Prisma client
RUN npx prisma generate

# 🔥 Build TypeScript
RUN npm run build

# Expose port
EXPOSE 5000

# Start compiled app
# CMD ["node", "dist/server.js"]
CMD sh -c "npx prisma migrate deploy && node --loader ts-node/esm src/scripts/seed-admin.ts && node dist/server.js"
