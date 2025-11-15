# Multi-stage Dockerfile for Node.js Express Backend
# Stage 1: Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json ./

# Install ALL dependencies (need dev deps for TypeScript build)
RUN npm install

# Copy Prisma schema
COPY prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Copy TypeScript config and source
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript to JavaScript
RUN npm run build

# Stage 2: Production Runtime
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json ./
# COPY package-lock.json ./

# Install ONLY production dependencies
RUN npm ci --omit=dev

# Copy Prisma schema and client from builder
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy compiled JavaScript from builder
COPY --from=builder /app/dist ./dist

# Create required directories
RUN mkdir -p uploads database

# Expose application port
EXPOSE 5001

# Set production environment
ENV NODE_ENV=production
ENV PORT=5001

# Start the application
CMD ["node", "dist/server.js"]
