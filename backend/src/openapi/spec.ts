/**
 * OpenAPI 3.0 Specification
 * Vehicle Inspection AI API
 * 
 * This specification defines all endpoints for the AI-powered vehicle damage assessment system.
 * The system supports angle-based photo capture (5 angles) with 2-phase workflow (pickup/return).
 * External API providers can be swapped at runtime via the provider registry.
 */

import { OpenAPIV3 } from 'openapi-types';

export const openApiSpec: OpenAPIV3.Document = {
    openapi: '3.0.0',
    info: {
        title: 'Vehicle Inspection AI API',
        version: '1.0.0',
        description: `
AI-powered vehicle damage assessment system for rental car damage detection.

## Features
- **Angle-Based Capture**: 5 vehicle angles (front, rear, driver_side, passenger_side, roof)
- **Two-Phase Workflow**: Pickup photos → Analysis → Return photos → Comparison → Report
- **AI Analysis**: Multiple provider support (mock, huggingface, roboflow, custom)
- **Location Matching**: Damages matched across phases using 50px location threshold
- **Cost Tracking**: Separate tracking for total damages vs. new damages only

## Architecture

### Provider System
The API uses a pluggable provider architecture to support multiple AI backends:
- **Mock**: For development/testing with realistic test data
- **Hugging Face**: Integration with HF inference API
- **Roboflow**: Integration with Roboflow object detection
- **Custom**: Your own inference endpoint

Providers can be swapped at runtime without redeploying the API.

### Workflow

1. **Create Assessment** - Start new assessment with vehicle info
2. **Upload Photos** - Upload 5 angles for pickup phase
3. **Check Completion** - Verify all angles captured
4. **Analyze Pickup** - Run AI on all pickup photos
5. **Upload Return Photos** - Capture 5 angles again at return
6. **Analyze Return** - Run AI on return photos
7. **Compare** - Identify NEW damages between phases
8. **Get Summary** - View damage report and costs

### Damage Matching
Damages are matched across phases using:
- **Location**: X,Y coordinates from photo analysis
- **Distance Threshold**: 50 pixels
- **Logic**: If pickup damage at (100,150) and return damage at (110,160), they're same damage (distance=14px < 50px)

### Cost Calculation
- **Total Cost**: Sum of all damages (pickup + return)
- **New Damages Cost**: Sum of return-only damages (rental period incidents)
        `,
        contact: {
            name: 'API Support',
            url: 'https://github.com/your-repo/issues',
        },
        license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT',
        },
    },
    servers: [
        {
            url: 'http://localhost:3001/api',
            description: 'Development server',
        },
        {
            url: 'https://api.example.com',
            description: 'Production server',
        },
    ],
    paths: {},
    components: {
        schemas: {
            Assessment: {
                type: 'object',
                description: 'Vehicle assessment record',
                properties: {
                    id: {
                        type: 'string',
                        description: 'Unique assessment identifier',
                        example: 'assessment-uuid-123',
                    },
                    vehicleId: {
                        type: 'string',
                        description: 'Vehicle identifier',
                        example: 'vehicle-456',
                    },
                    vehicleName: {
                        type: 'string',
                        description: 'Vehicle description',
                        example: '2020 Toyota Camry - License ABC123',
                    },
                    status: {
                        type: 'string',
                        enum: ['pickup_in_progress', 'pickup_complete', 'return_in_progress', 'completed'],
                        description: 'Current assessment status',
                        example: 'pickup_complete',
                    },
                    createdAt: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Assessment creation timestamp',
                        example: '2025-01-17T10:30:00Z',
                    },
                    updatedAt: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Last update timestamp',
                        example: '2025-01-17T11:45:00Z',
                    },
                    totalCost: {
                        type: 'number',
                        description: 'Estimated total repair cost in USD',
                        example: 2500.50,
                    },
                    newDamageCost: {
                        type: 'number',
                        description: 'Cost of new damages (return phase only)',
                        example: 500.00,
                    },
                },
                required: ['id', 'vehicleId', 'vehicleName', 'status', 'createdAt'],
            },

            Photo: {
                type: 'object',
                description: 'Vehicle photo record',
                properties: {
                    id: {
                        type: 'string',
                        description: 'Unique photo identifier',
                        example: 'photo-uuid-789',
                    },
                    assessmentId: {
                        type: 'string',
                        description: 'Parent assessment ID',
                        example: 'assessment-uuid-123',
                    },
                    angle: {
                        type: 'string',
                        enum: ['front', 'rear', 'driver_side', 'passenger_side', 'roof'],
                        description: 'Vehicle angle captured',
                        example: 'front',
                    },
                    phase: {
                        type: 'string',
                        enum: ['pickup', 'return'],
                        description: 'Assessment phase',
                        example: 'pickup',
                    },
                    filename: {
                        type: 'string',
                        description: 'Original filename',
                        example: 'photo_front_001.jpg',
                    },
                    storagePath: {
                        type: 'string',
                        description: 'Path to stored file',
                        example: '/uploads/assessments/abc123/front_pickup.jpg',
                    },
                    fileSize: {
                        type: 'number',
                        description: 'File size in bytes',
                        example: 2048576,
                    },
                    uploadedAt: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Upload timestamp',
                        example: '2025-01-17T10:35:00Z',
                    },
                },
                required: ['id', 'assessmentId', 'angle', 'phase', 'filename', 'storagePath', 'uploadedAt'],
            },

            Damage: {
                type: 'object',
                description: 'Detected vehicle damage',
                properties: {
                    id: {
                        type: 'string',
                        description: 'Unique damage identifier',
                        example: 'damage-uuid-456',
                    },
                    photoId: {
                        type: 'string',
                        description: 'Associated photo ID',
                        example: 'photo-uuid-789',
                    },
                    assessmentId: {
                        type: 'string',
                        description: 'Parent assessment ID',
                        example: 'assessment-uuid-123',
                    },
                    angle: {
                        type: 'string',
                        enum: ['front', 'rear', 'driver_side', 'passenger_side', 'roof'],
                        description: 'Vehicle angle of damage',
                        example: 'front',
                    },
                    phase: {
                        type: 'string',
                        enum: ['pickup', 'return'],
                        description: 'Phase when detected',
                        example: 'pickup',
                    },
                    description: {
                        type: 'string',
                        description: 'Damage description',
                        example: 'Bumper dent with paint damage',
                    },
                    severity: {
                        type: 'string',
                        enum: ['minor', 'moderate', 'severe'],
                        description: 'Damage severity level',
                        example: 'moderate',
                    },
                    location: {
                        type: 'string',
                        description: 'X,Y coordinates in photo (format: x:123,y:456)',
                        example: 'x:100,y:150',
                    },
                    estimatedCost: {
                        type: 'number',
                        description: 'Estimated repair cost in USD',
                        example: 500.00,
                    },
                    isNew: {
                        type: 'boolean',
                        description: 'True if damage is new (only in return phase)',
                        example: false,
                    },
                    detectedAt: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Detection timestamp',
                        example: '2025-01-17T10:40:00Z',
                    },
                },
                required: ['id', 'assessmentId', 'angle', 'phase', 'severity', 'location', 'detectedAt'],
            },

            DamageSummary: {
                type: 'object',
                description: 'Comprehensive damage report',
                properties: {
                    assessmentId: {
                        type: 'string',
                        example: 'assessment-uuid-123',
                    },
                    status: {
                        type: 'string',
                        enum: ['pickup_in_progress', 'pickup_complete', 'return_in_progress', 'completed'],
                        example: 'completed',
                    },
                    damagesByAngle: {
                        type: 'object',
                        description: 'Damage count per angle',
                        properties: {
                            front: {
                                type: 'object',
                                properties: {
                                    pickup: { type: 'number', example: 1 },
                                    return: { type: 'number', example: 2 },
                                    new: { type: 'number', example: 1 },
                                },
                            },
                            rear: {
                                type: 'object',
                                properties: {
                                    pickup: { type: 'number', example: 0 },
                                    return: { type: 'number', example: 0 },
                                    new: { type: 'number', example: 0 },
                                },
                            },
                            driver_side: {
                                type: 'object',
                                properties: {
                                    pickup: { type: 'number', example: 1 },
                                    return: { type: 'number', example: 1 },
                                    new: { type: 'number', example: 0 },
                                },
                            },
                            passenger_side: {
                                type: 'object',
                                properties: {
                                    pickup: { type: 'number', example: 0 },
                                    return: { type: 'number', example: 0 },
                                    new: { type: 'number', example: 0 },
                                },
                            },
                            roof: {
                                type: 'object',
                                properties: {
                                    pickup: { type: 'number', example: 0 },
                                    return: { type: 'number', example: 1 },
                                    new: { type: 'number', example: 1 },
                                },
                            },
                        },
                    },
                    severityDistribution: {
                        type: 'object',
                        description: 'Damage count by severity',
                        properties: {
                            minor: {
                                type: 'object',
                                properties: {
                                    total: { type: 'number', example: 2 },
                                    new: { type: 'number', example: 0 },
                                },
                            },
                            moderate: {
                                type: 'object',
                                properties: {
                                    total: { type: 'number', example: 2 },
                                    new: { type: 'number', example: 1 },
                                },
                            },
                            severe: {
                                type: 'object',
                                properties: {
                                    total: { type: 'number', example: 0 },
                                    new: { type: 'number', example: 0 },
                                },
                            },
                        },
                    },
                    costBreakdown: {
                        type: 'object',
                        description: 'Cost analysis',
                        properties: {
                            totalDamageCost: {
                                type: 'number',
                                description: 'Sum of all damages (pickup + return)',
                                example: 2500.50,
                            },
                            newDamageCost: {
                                type: 'number',
                                description: 'Sum of new damages (return phase only)',
                                example: 500.00,
                            },
                            costByAngle: {
                                type: 'object',
                                description: 'Cost per angle',
                                properties: {
                                    front: { type: 'number', example: 750.00 },
                                    rear: { type: 'number', example: 0.00 },
                                    driver_side: { type: 'number', example: 400.00 },
                                    passenger_side: { type: 'number', example: 0.00 },
                                    roof: { type: 'number', example: 1350.50 },
                                },
                            },
                        },
                    },
                    damages: {
                        type: 'array',
                        description: 'List of all detected damages',
                        items: {
                            $ref: '#/components/schemas/Damage',
                        },
                    },
                    generatedAt: {
                        type: 'string',
                        format: 'date-time',
                        example: '2025-01-17T12:00:00Z',
                    },
                },
                required: ['assessmentId', 'status', 'damagesByAngle', 'costBreakdown'],
            },

            PhaseStatus: {
                type: 'object',
                description: 'Phase completion status',
                properties: {
                    phase: {
                        type: 'string',
                        enum: ['pickup', 'return'],
                        example: 'pickup',
                    },
                    isComplete: {
                        type: 'boolean',
                        description: 'True if all 5 angles have been photographed',
                        example: true,
                    },
                    photosCollected: {
                        type: 'number',
                        description: 'Number of photos collected',
                        example: 5,
                    },
                    missingAngles: {
                        type: 'array',
                        description: 'Angles still needing photos',
                        items: {
                            type: 'string',
                            enum: ['front', 'rear', 'driver_side', 'passenger_side', 'roof'],
                        },
                        example: [],
                    },
                },
                required: ['phase', 'isComplete', 'missingAngles'],
            },

            Error: {
                type: 'object',
                description: 'Error response',
                properties: {
                    success: {
                        type: 'boolean',
                        example: false,
                    },
                    error: {
                        type: 'string',
                        example: 'Assessment not found',
                    },
                    message: {
                        type: 'string',
                        example: 'Assessment not found',
                    },
                },
                required: ['success', 'error'],
            },
        },

        securitySchemes: {
            ApiKeyAuth: {
                type: 'apiKey',
                in: 'header',
                name: 'X-API-Key',
                description: 'API key for external provider integration',
            },
        },
    },

    security: [
        {
            ApiKeyAuth: [],
        },
    ],

    tags: [
        {
            name: 'Assessments',
            description: 'Assessment lifecycle management (create, retrieve, complete)',
        },
        {
            name: 'Photos',
            description: 'Photo upload and retrieval for 5-angle capture',
        },
        {
            name: 'Phase Management',
            description: 'Phase progression and completion status',
        },
        {
            name: 'AI Analysis',
            description: 'Damage detection using configurable AI providers',
        },
        {
            name: 'Damage Analysis',
            description: 'Damage comparison and matching between phases',
        },
        {
            name: 'Reports',
            description: 'Damage summaries and cost breakdowns',
        },
    ],
};

export default openApiSpec;
