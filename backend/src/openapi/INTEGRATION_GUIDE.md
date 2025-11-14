/**

* API Integration Guide
* Shows how to integrate the assessment routes and Swagger UI into your Express server
*
* Add this to your main server.ts file
 */

// ============================================================================
// IMPORT STATEMENTS (add to server.ts)
// ============================================================================

/**
import express from 'express';
import assessmentRoutes from '@/routes/assessments';
import { setupSwaggerUI } from '@/openapi/swagger';

const app = express();
 */

// ============================================================================
// MIDDLEWARE SETUP (add before routes)
// ============================================================================

/**
// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Logger middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});
 */

// ============================================================================
// ROUTE REGISTRATION (add after middleware)
// ============================================================================

/**
// Setup Swagger UI with OpenAPI documentation
setupSwaggerUI(app);

// Register assessment routes
app.use('/api/assessments', assessmentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
    });
});

// OpenAPI endpoints (also handled by setupSwaggerUI)
// GET  /api/docs                  - Swagger UI (interactive documentation)
// GET  /api/openapi.json          - Raw OpenAPI specification (JSON)
// GET  /api/openapi.yaml          - Raw OpenAPI specification (YAML)
 */

// ============================================================================
// COMPLETE ROUTES REFERENCE
// ============================================================================

/**
ASSESSMENT LIFECYCLE:
  POST   /api/assessments                     - Create new assessment
  GET    /api/assessments/:id                 - Get assessment details

PHOTO UPLOAD:
  POST   /api/assessments/:id/photos/:angle/:phase   - Upload photo
  GET    /api/assessments/:id/phase-status/:phase    - Check phase completion

AI ANALYSIS:
  POST   /api/assessments/:id/analyze/pickup  - Analyze pickup photos
  POST   /api/assessments/:id/analyze/return  - Analyze return photos
  POST   /api/assessments/:id/compare         - Compare pickup vs return

REPORTING:
  GET    /api/assessments/:id/summary        - Get damage summary & costs

DOCUMENTATION:
  GET    /api/docs                           - Interactive Swagger UI
  GET    /api/openapi.json                   - OpenAPI spec (JSON format)
  GET    /api/openapi.yaml                   - OpenAPI spec (YAML format)

HEALTH:
  GET    /api/health                         - API health check
 */

// ============================================================================
// EXTERNAL API PROVIDER INTEGRATION EXAMPLES
// ============================================================================

/**
The system supports multiple AI providers via the provider registry.
To integrate external APIs, register them in your server initialization:

import { providerRegistry } from '@/services/aiProvider';
import { huggingfaceProvider } from '@/services/providers/huggingfaceProvider';
import { roboflowProvider } from '@/services/providers/roboflowProvider';

// Register providers during server startup
await providerRegistry.registerProvider('mock', mockProvider);
await providerRegistry.registerProvider('huggingface', huggingfaceProvider);
await providerRegistry.registerProvider('roboflow', roboflowProvider);

// Set active provider from environment or config
const activeProvider = process.env.AI_PROVIDER || 'mock';
await providerRegistry.setActiveProvider(activeProvider);

// Now all AI analysis will use the configured provider
// API clients don't need to know which provider is active
*/

// ============================================================================
// ENVIRONMENT VARIABLES
// ============================================================================

/**
Required:
  PORT=3001                     - Server port
  NODE_ENV=development          - Environment

AI Provider Configuration:
  AI_PROVIDER=mock              - Active provider (mock|huggingface|roboflow|custom)
  
HuggingFace Provider:
  HUGGINGFACE_API_KEY=...       - HF API key
  HUGGINGFACE_MODEL_ID=...      - HF model ID for damage detection
  
Roboflow Provider:
  ROBOFLOW_API_KEY=...          - Roboflow API key
  ROBOFLOW_MODEL_ID=...         - Roboflow model ID
  ROBOFLOW_PROJECT_NAME=...     - Roboflow project name

Custom Provider:
  CUSTOM_AI_ENDPOINT=...        - Your inference endpoint URL
  CUSTOM_AI_API_KEY=...         - Your API key (if required)
*/

// ============================================================================
// EXAMPLE: CALLING ASSESSMENT ENDPOINTS
// ============================================================================

/**

1. CREATE ASSESSMENT
POST /api/assessments
{
  "vehicleId": "rental-456",
  "vehicleName": "2020 Toyota Camry - License ABC123"
}

Response (201):
{
  "success": true,
  "data": {
    "id": "assessment-uuid-1",
    "vehicleId": "rental-456",
    "vehicleName": "2020 Toyota Camry - License ABC123",
    "status": "pickup_in_progress",
    "totalCost": 0,
    "newDamageCost": 0,
    "createdAt": "2025-01-17T10:30:00Z"
  }
}

2. UPLOAD PHOTO (repeat for each angle: front, rear, driver_side, passenger_side, roof)
POST /api/assessments/assessment-uuid-1/photos/front/pickup
{
  "filename": "photo_front_001.jpg",
  "storagePath": "/uploads/assessments/assessment-uuid-1/front_pickup.jpg",
  "fileSize": 2048576
}

Response (201):
{
  "success": true,
  "data": {
    "id": "photo-uuid-1",
    "assessmentId": "assessment-uuid-1",
    "angle": "front",
    "phase": "pickup",
    "filename": "photo_front_001.jpg",
    "storagePath": "/uploads/assessments/assessment-uuid-1/front_pickup.jpg",
    "fileSize": 2048576,
    "uploadedAt": "2025-01-17T10:35:00Z"
  }
}

3. CHECK PHASE COMPLETION
GET /api/assessments/assessment-uuid-1/phase-status/pickup

Response (200):
{
  "success": true,
  "data": {
    "phase": "pickup",
    "isComplete": true,
    "photosCollected": 5,
    "missingAngles": []
  }
}

4. ANALYZE PICKUP PHOTOS
POST /api/assessments/assessment-uuid-1/analyze/pickup

Response (200):
{
  "success": true,
  "message": "Pickup photos analyzed successfully",
  "data": {
    "id": "assessment-uuid-1",
    "status": "pickup_complete",
    "totalCost": 1500.00,
    ...
  }
}

5. UPLOAD RETURN PHOTOS (repeat for each angle)
POST /api/assessments/assessment-uuid-1/photos/front/return
{
  "filename": "photo_front_return.jpg",
  "storagePath": "/uploads/assessments/assessment-uuid-1/front_return.jpg",
  "fileSize": 2048576
}

6. ANALYZE RETURN PHOTOS
POST /api/assessments/assessment-uuid-1/analyze/return

Response (200):
{
  "success": true,
  "message": "Return photos analyzed successfully",
  "data": {
    "id": "assessment-uuid-1",
    "status": "return_in_progress",
    "totalCost": 2000.00,
    ...
  }
}

7. COMPARE PHASES & DETECT NEW DAMAGES
POST /api/assessments/assessment-uuid-1/compare

Response (200):
{
  "success": true,
  "message": "Comparison completed successfully",
  "data": {
    "id": "assessment-uuid-1",
    "status": "completed",
    "totalCost": 2000.00,
    "newDamageCost": 500.00,
    ...
  }
}

8. GET DAMAGE SUMMARY & REPORT
GET /api/assessments/assessment-uuid-1/summary

Response (200):
{
  "success": true,
  "data": {
    "assessmentId": "assessment-uuid-1",
    "status": "completed",
    "damagesByAngle": {
      "front": { "pickup": 1, "return": 2, "new": 1 },
      "rear": { "pickup": 0, "return": 0, "new": 0 },
      ...
    },
    "severityDistribution": {
      "minor": { "total": 2, "new": 0 },
      "moderate": { "total": 2, "new": 1 },
      "severe": { "total": 0, "new": 0 }
    },
    "costBreakdown": {
      "totalDamageCost": 2000.00,
      "newDamageCost": 500.00,
      "costByAngle": {
        "front": 750.00,
        "rear": 0.00,
        ...
      }
    },
    "damages": [...],
    "generatedAt": "2025-01-17T12:00:00Z"
  }
}

*/

export const apiIntegrationGuide = `
See comments in this file for complete integration instructions
`;
