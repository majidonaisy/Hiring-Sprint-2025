import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { setupSwaggerUI } from './openapi/swagger';
import assessmentRoutes from './routes/assessments';
import initializeAIProviders from './services/providerSetup';
import { initializeStorageProviders } from './services/storageSetup';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

/**
 * MIDDLEWARE SETUP
 */

// Security
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Logging
app.use(morgan('combined'));

// Body Parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

/**
 * SWAGGER UI & API DOCUMENTATION
 */
setupSwaggerUI(app);

/**
 * ROUTES
 */

// Assessment endpoints
app.use('/api/assessments', assessmentRoutes);

// Health Check Endpoint
app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// API Status
app.get('/api/status', (_req: Request, res: Response) => {
    res.status(200).json({
        message: 'Vehicle Inspection API is running',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
    });
});

// 404 Handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        error: 'Not Found',
        path: req.path,
        method: req.method,
    });
});

// Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});

/**
 * SERVER START
 */
app.listen(PORT, async () => {
    // Initialize AI providers on startup
    try {
        await initializeAIProviders();
    } catch (error) {
        console.error('Failed to initialize AI providers:', error);
    }

    // Initialize storage providers on startup
    try {
        await initializeStorageProviders();
    } catch (error) {
        console.error('Failed to initialize storage providers:', error);
    }

    console.log(`
╔════════════════════════════════════════╗
║   🚗 Vehicle Inspection API Server    ║
╚════════════════════════════════════════╝
  
  Server running at: http://localhost:${PORT}
  Environment: ${process.env.NODE_ENV || 'development'}
  Database: ${process.env.DATABASE_PATH || './database/inspections.db'}
  
  Endpoints:
    GET  /health               - Health check
    GET  /api/status           - API status
    POST /api/assessments      - Create assessment
    GET  /api/assessments/:id  - Get assessment
    GET  /api/docs             - Swagger UI
    GET  /api/openapi.json     - OpenAPI spec
  
  Ready to accept requests...
  `);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\nSIGINT received, shutting down gracefully...');
    process.exit(0);
});

export default app;
