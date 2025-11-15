# Multi-stage Dockerfile for Node.js Express Backend
# Stage 1: Build Stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files (including package-lock.json)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy Prisma schema for build
COPY prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY src ./src
COPY tsconfig.json ./

# Build TypeScript
RUN npm install --save-dev typescript ts-node @types/node && \
    npx tsc && \
    npm prune --omit=dev

# Stage 2: Runtime Stage
FROM node:22-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy Prisma from builder
COPY --from=builder /app/prisma ./prisma

# Copy built application
COPY --from=builder /app/dist ./dist

# Create upload directory
RUN mkdir -p uploads database

# Expose port
EXPOSE 5001

# Set environment
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5001/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/server.js"]
