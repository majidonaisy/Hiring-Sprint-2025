/**
 * Assessment Routes
 * HTTP endpoints for vehicle inspection API
 * All endpoints documented with OpenAPI 3.0 annotations
 */

import { Router } from 'express';
import {
    createAssessmentHandler,
    getAssessmentHandler,
    getAllAssessmentsHandler,
    uploadPhotoHandler,
    deletePhotoHandler,
    getPhaseStatusHandler,
    analyzePickupHandler,
    analyzeReturnHandler,
    comparePhotosHandler,
    getDamageSummaryHandler,
} from '../controllers/assessmentController.js';

const router = Router();

// ============================================================================
// ASSESSMENT LIFECYCLE ENDPOINTS
// ============================================================================

/**
 * @openapi
 * /assessments:
 *   post:
 *     summary: Create a new vehicle assessment
 *     description: Initiates a new assessment for a vehicle. Returns assessment ID for use in subsequent operations.
 *     tags:
 *       - Assessments
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vehicleId
 *               - vehicleName
 *             properties:
 *               vehicleId:
 *                 type: string
 *                 example: "vehicle-123"
 *                 description: Unique identifier for the vehicle
 *               vehicleName:
 *                 type: string
 *                 example: "2020 Toyota Camry"
 *                 description: Human-readable vehicle name/description
 *     responses:
 *       201:
 *         description: Assessment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Assessment'
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error during assessment creation
 */
router.post('/', createAssessmentHandler);

/**
 * @openapi
 * /assessments:
 *   get:
 *     summary: Get all assessments
 *     description: Retrieve all assessments with pagination support
 *     tags:
 *       - Assessments
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number (1-indexed)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of assessments per page
 *     responses:
 *       200:
 *         description: Assessments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Assessment'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       500:
 *         description: Server error during fetch
 */
router.get('/', getAllAssessmentsHandler);

/**
 * @openapi
 * /assessments/{id}:
 *   get:
 *     summary: Get assessment details
 *     description: Retrieve full assessment data including status, photos, and damages
 *     tags:
 *       - Assessments
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Assessment ID
 *     responses:
 *       200:
 *         description: Assessment retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Assessment'
 *       404:
 *         description: Assessment not found
 *       500:
 *         description: Server error
 */
router.get('/:id', getAssessmentHandler);

// ============================================================================
// PHOTO UPLOAD ENDPOINTS
// ============================================================================

/**
 * @openapi
 * /assessments/{id}/photos/{angle}/{phase}:
 *   post:
 *     summary: Upload a photo for a specific angle and phase
 *     description: Upload a vehicle photo. Supports 5 angles (front, rear, driver_side, passenger_side, roof) and 2 phases (pickup, return)
 *     tags:
 *       - Photos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Assessment ID
 *       - in: path
 *         name: angle
 *         required: true
 *         schema:
 *           type: string
 *           enum: [front, rear, driver_side, passenger_side, roof]
 *         description: Vehicle angle
 *       - in: path
 *         name: phase
 *         required: true
 *         schema:
 *           type: string
 *           enum: [pickup, return]
 *         description: Assessment phase
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - filename
 *               - storagePath
 *               - fileSize
 *             properties:
 *               filename:
 *                 type: string
 *                 example: "photo_front_1.jpg"
 *               storagePath:
 *                 type: string
 *                 example: "/uploads/assessments/abc123/front_pickup.jpg"
 *               fileSize:
 *                 type: number
 *                 example: 2048576
 *                 description: File size in bytes
 *     responses:
 *       201:
 *         description: Photo uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Photo'
 *       400:
 *         description: Invalid parameters or missing fields
 *       404:
 *         description: Assessment not found
 *       500:
 *         description: Server error during upload
 */
router.post('/:id/photos/:angle/:phase', uploadPhotoHandler);

/**
 * @openapi
 * /assessments/{id}/photos/{angle}/{phase}:
 *   delete:
 *     summary: Delete a photo for a specific angle and phase
 *     description: Remove a photo from the assessment. Also deletes from storage if available.
 *     tags:
 *       - Photos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Assessment ID
 *       - in: path
 *         name: angle
 *         required: true
 *         schema:
 *           type: string
 *           enum: [front, rear, driver_side, passenger_side, roof]
 *         description: Vehicle angle
 *       - in: path
 *         name: phase
 *         required: true
 *         schema:
 *           type: string
 *           enum: [pickup, return]
 *         description: Assessment phase
 *     responses:
 *       200:
 *         description: Photo deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Photo deleted successfully"
 *       404:
 *         description: Photo or assessment not found
 *       500:
 *         description: Server error during deletion
 */
router.delete('/:id/photos/:angle/:phase', deletePhotoHandler);

/**
 * @openapi
 * /assessments/{id}/phase-status/{phase}:
 *   get:
 *     summary: Get phase completion status
 *     description: Check if all 5 angles have been photographed for a phase and list any missing angles
 *     tags:
 *       - Phase Management
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Assessment ID
 *       - in: path
 *         name: phase
 *         required: true
 *         schema:
 *           type: string
 *           enum: [pickup, return]
 *         description: Assessment phase
 *     responses:
 *       200:
 *         description: Phase status retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     phase:
 *                       type: string
 *                     isComplete:
 *                       type: boolean
 *                       description: True if all 5 angles photographed
 *                     missingAngles:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: List of angles still needing photos
 *       404:
 *         description: Assessment not found
 *       500:
 *         description: Server error
 */
router.get('/:id/phase-status/:phase', getPhaseStatusHandler);

// ============================================================================
// AI ANALYSIS ENDPOINTS
// ============================================================================

/**
 * @openapi
 * /assessments/{id}/analyze/pickup:
 *   post:
 *     summary: Analyze pickup phase photos
 *     description: |
 *       Run AI analysis on all pickup photos to detect vehicle damages.
 *       Supports multiple AI providers (mock, huggingface, roboflow, custom).
 *       All damages are stored with location (x,y coordinates) and severity.
 *     tags:
 *       - AI Analysis
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Assessment ID
 *     responses:
 *       200:
 *         description: Analysis completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Assessment'
 *       404:
 *         description: Assessment not found
 *       500:
 *         description: Server error during analysis
 */
router.post('/:id/analyze/pickup', analyzePickupHandler);

/**
 * @openapi
 * /assessments/{id}/analyze/return:
 *   post:
 *     summary: Analyze return phase photos
 *     description: |
 *       Run AI analysis on all return photos to detect vehicle damages.
 *       Compares against pickup baseline to identify new damages.
 *     tags:
 *       - AI Analysis
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Assessment ID
 *     responses:
 *       200:
 *         description: Analysis completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Assessment'
 *       404:
 *         description: Assessment not found
 *       500:
 *         description: Server error during analysis
 */
router.post('/:id/analyze/return', analyzeReturnHandler);

/**
 * @openapi
 * /assessments/{id}/compare:
 *   post:
 *     summary: Compare pickup and return phases
 *     description: |
 *       Compare damages detected in pickup vs return phases to identify NEW damages.
 *       Uses location-based matching (50px threshold) to determine if damages are the same.
 *       New damages indicate additional harm during rental period.
 *     tags:
 *       - Damage Analysis
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Assessment ID
 *     responses:
 *       200:
 *         description: Comparison completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Assessment'
 *       404:
 *         description: Assessment not found
 *       500:
 *         description: Server error during comparison
 */
router.post('/:id/compare', comparePhotosHandler);

// ============================================================================
// REPORTING ENDPOINTS
// ============================================================================

/**
 * @openapi
 * /assessments/{id}/summary:
 *   get:
 *     summary: Get damage summary and cost breakdown
 *     description: |
 *       Retrieve damage summary including:
 *       - Total damages by angle and phase
 *       - New damages (detected in return phase only)
 *       - Severity distribution (minor, moderate, severe)
 *       - Cost breakdown (total vs new damages only)
 *       - Estimated repair costs
 *     tags:
 *       - Reports
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Assessment ID
 *     responses:
 *       200:
 *         description: Damage summary retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/DamageSummary'
 *       404:
 *         description: Assessment not found
 *       500:
 *         description: Server error
 */
router.get('/:id/summary', getDamageSummaryHandler);

export default router;
