/**
 * Swagger UI Integration
 * Sets up Swagger middleware to serve interactive API documentation
 * Accessible at /api/docs (Swagger UI) and /api/openapi.json (raw spec)
 */

import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import openApiSpec from './spec.js';
import { Express } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Configure and integrate Swagger UI with Express app
 */
export function setupSwaggerUI(app: Express): void {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const PORT = process.env.PORT || 3001;

    // Swagger options
    const options = {
        definition: openApiSpec,
        apis: [
            path.join(__dirname, '../routes/*.js'),
            path.join(__dirname, '../routes/*.ts')
        ], // Scans route files for JSDoc comments
    };

    // Generate Swagger spec from JSDoc comments (combines with explicit spec)
    const swaggerSpec = swaggerJsdoc(options);

    // Serve Swagger UI at /api/docs
    app.use(
        '/api/docs',
        swaggerUi.serve,
        swaggerUi.setup(swaggerSpec, {
            swaggerOptions: {
                // UI Configuration
                persistAuthorization: true, // Remember API key across page refreshes
                displayRequestDuration: true, // Show request duration
                displayOperationId: false, // Don't show operationId
                filter: false, // Disable filter input
                defaultModelsExpandDepth: 1,
                defaultModelExpandDepth: 1,
                docExpansion: 'list', // Expand operations by default
            },
            customCss: `
                .swagger-ui .topbar { display: none; }
                .swagger-ui .scheme-container { background: #fafafa; }
                .swagger-ui .btn.authorize { background: #4CAF50; }
                .swagger-ui .btn.authorize:hover { background: #45a049; }
            `,
            customSiteTitle: 'Vehicle Inspection API - Swagger UI',
            customfavIcon: '/favicon.ico',
        })
    );

    // Serve raw OpenAPI spec at /api/openapi.json
    app.get('/api/openapi.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });

    // Serve OpenAPI YAML at /api/openapi.yaml
    app.get('/api/openapi.yaml', (_req, res) => {
        res.setHeader('Content-Type', 'application/yaml');
        // Convert JSON spec to YAML (if needed, can use js-yaml library)
        res.send(JSON.stringify(swaggerSpec, null, 2));
    });

    console.log(`✓ Swagger UI configured at http://localhost:${PORT}/api/docs`);
    console.log(`✓ OpenAPI spec available at http://localhost:${PORT}/api/openapi.json`);
}

export default setupSwaggerUI;
