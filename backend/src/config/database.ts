/**
 * Database Configuration
 * Prisma ORM with PostgreSQL and connection pooling
 */

import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Global Prisma Client
 * Using singleton pattern to avoid multiple instances
 */
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: process.env.NODE_ENV === 'development'
            ? ['query', 'info', 'warn', 'error']
            : ['error'],
        datasources: {
            db: {
                url: process.env.DATABASE_URL +
                    `?connection_limit=${process.env.DATABASE_POOL_MAX || 10}` +
                    `&pool_timeout=${process.env.DATABASE_POOL_TIMEOUT || 20}` +
                    `&connect_timeout=${process.env.DATABASE_CONNECTION_TIMEOUT || 20}`,
            },
        },
    });

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

// Handle connection errors gracefully
prisma.$connect().catch((err) => {
    console.error('Failed to connect to database:', err);
    process.exit(1);
});

// Graceful shutdown
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});

/**
 * Gracefully disconnect on process termination
 */
process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    process.exit(0);
});

export const DB_PATH = path.join(__dirname, '../../database/inspections.db');