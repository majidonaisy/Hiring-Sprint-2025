import request from 'supertest';
import express, { Express } from 'express';

// Create a minimal test app
const app: Express = express();

app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

app.get('/api/status', (_req, res) => {
    res.status(200).json({
        message: 'Vehicle Inspection API is running',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
    });
});

describe('Health Check Endpoints', () => {
    describe('GET /health', () => {
        it('should return 200 and health status', async () => {
            const response = await request(app).get('/health');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status', 'OK');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('uptime');
        });

        it('should return valid timestamp format', async () => {
            const response = await request(app).get('/health');

            const timestamp = new Date(response.body.timestamp);
            expect(timestamp.toString()).not.toBe('Invalid Date');
        });

        it('should return numeric uptime', async () => {
            const response = await request(app).get('/health');

            expect(typeof response.body.uptime).toBe('number');
            expect(response.body.uptime).toBeGreaterThanOrEqual(0);
        });
    });

    describe('GET /api/status', () => {
        it('should return 200 and API status', async () => {
            const response = await request(app).get('/api/status');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Vehicle Inspection API is running');
            expect(response.body).toHaveProperty('version', '1.0.0');
            expect(response.body).toHaveProperty('environment');
        });

        it('should have correct version', async () => {
            const response = await request(app).get('/api/status');

            expect(response.body.version).toBe('1.0.0');
        });
    });
});
