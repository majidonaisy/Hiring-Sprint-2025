/**
 * Assessment Controller
 * HTTP request handlers for inspection workflow
 * Delegates to inspection service for business logic
 */

import { Request, Response } from 'express';
import {
    startAssessment,
    uploadPhotoByAngle,
    analyzePickupPhotos,
    analyzeReturnPhotos,
    comparePhotosAndDamages,
    getDamageSummary,
    getPhaseStatus,
    getAssessment,
} from '@/services/inspectionService';
import { VehicleAngle, AssessmentPhase } from '@/types';

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

function successResponse<T>(data: T): ApiResponse<T> {
    return { success: true, data };
}

function errorResponse(error: string): ApiResponse {
    return { success: false, error, message: error };
}

// ============================================================================
// ASSESSMENT ENDPOINTS
// ============================================================================

/**
 * POST /assessments
 * Create a new assessment
 */
export async function createAssessmentHandler(req: Request, res: Response): Promise<void> {
    try {
        const { vehicleId, vehicleName } = req.body;

        if (!vehicleId || !vehicleName) {
            res.status(400).json(errorResponse('vehicleId and vehicleName are required'));
            return;
        }

        const assessment = await startAssessment(vehicleId, vehicleName);
        res.status(201).json(successResponse(assessment));
    } catch (error) {
        res.status(500).json(errorResponse(`Failed to create assessment: ${error}`));
    }
}

/**
 * GET /assessments/:id
 * Get assessment by ID
 */
export async function getAssessmentHandler(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;

        const assessment = await getAssessment(id);
        if (!assessment) {
            res.status(404).json(errorResponse('Assessment not found'));
            return;
        }

        res.status(200).json(successResponse(assessment));
    } catch (error) {
        res.status(500).json(errorResponse(`Failed to fetch assessment: ${error}`));
    }
}

// ============================================================================
// PHOTO UPLOAD ENDPOINTS
// ============================================================================

/**
 * POST /assessments/:id/photos/:angle/:phase
 * Upload a photo for a specific angle and phase
 */
export async function uploadPhotoHandler(req: Request, res: Response): Promise<void> {
    try {
        const { id, angle, phase } = req.params;
        const { filename, storagePath, fileSize } = req.body;

        // Validate inputs
        if (!filename || !storagePath || !fileSize) {
            res.status(400).json(errorResponse('filename, storagePath, and fileSize are required'));
            return;
        }

        const validAngles: VehicleAngle[] = ['front', 'rear', 'driver_side', 'passenger_side', 'roof'];
        const validPhases: AssessmentPhase[] = ['pickup', 'return'];

        if (!validAngles.includes(angle as VehicleAngle)) {
            res.status(400).json(errorResponse(`Invalid angle. Must be one of: ${validAngles.join(', ')}`));
            return;
        }

        if (!validPhases.includes(phase as AssessmentPhase)) {
            res.status(400).json(errorResponse(`Invalid phase. Must be one of: ${validPhases.join(', ')}`));
            return;
        }

        const photo = await uploadPhotoByAngle(id, angle as VehicleAngle, phase as AssessmentPhase, filename, storagePath, fileSize);
        res.status(201).json(successResponse(photo));
    } catch (error) {
        res.status(500).json(errorResponse(`Failed to upload photo: ${error}`));
    }
}

/**
 * GET /assessments/:id/phase-status/:phase
 * Check phase completion status and missing angles
 */
export async function getPhaseStatusHandler(req: Request, res: Response): Promise<void> {
    try {
        const { id, phase } = req.params;

        const validPhases: AssessmentPhase[] = ['pickup', 'return'];
        if (!validPhases.includes(phase as AssessmentPhase)) {
            res.status(400).json(errorResponse(`Invalid phase. Must be one of: ${validPhases.join(', ')}`));
            return;
        }

        const status = await getPhaseStatus(id, phase as AssessmentPhase);
        if (!status) {
            res.status(404).json(errorResponse('Assessment not found'));
            return;
        }

        res.status(200).json(successResponse(status));
    } catch (error) {
        res.status(500).json(errorResponse(`Failed to get phase status: ${error}`));
    }
}

// ============================================================================
// ANALYSIS ENDPOINTS
// ============================================================================

/**
 * POST /assessments/:id/analyze/pickup
 * Analyze all pickup photos and detect damages
 */
export async function analyzePickupHandler(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;

        const assessment = await analyzePickupPhotos(id);
        if (!assessment) {
            res.status(404).json(errorResponse('Assessment not found'));
            return;
        }

        res.status(200).json(successResponse({
            message: 'Pickup photos analyzed successfully',
            assessment,
        }));
    } catch (error) {
        res.status(500).json(errorResponse(`Failed to analyze pickup photos: ${error}`));
    }
}

/**
 * POST /assessments/:id/analyze/return
 * Analyze all return photos and detect damages
 */
export async function analyzeReturnHandler(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;

        const assessment = await analyzeReturnPhotos(id);
        if (!assessment) {
            res.status(404).json(errorResponse('Assessment not found'));
            return;
        }

        res.status(200).json(successResponse({
            message: 'Return photos analyzed successfully',
            assessment,
        }));
    } catch (error) {
        res.status(500).json(errorResponse(`Failed to analyze return photos: ${error}`));
    }
}

/**
 * POST /assessments/:id/compare
 * Compare pickup and return photos, identify new damages
 */
export async function comparePhotosHandler(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;

        const assessment = await comparePhotosAndDamages(id);
        if (!assessment) {
            res.status(404).json(errorResponse('Assessment not found'));
            return;
        }

        res.status(200).json(successResponse({
            message: 'Comparison completed successfully',
            assessment,
        }));
    } catch (error) {
        res.status(500).json(errorResponse(`Failed to compare photos: ${error}`));
    }
}

// ============================================================================
// REPORT ENDPOINTS
// ============================================================================

/**
 * GET /assessments/:id/summary
 * Get damage summary and cost breakdown
 */
export async function getDamageSummaryHandler(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;

        const summary = await getDamageSummary(id);
        if (!summary) {
            res.status(404).json(errorResponse('Assessment not found'));
            return;
        }

        res.status(200).json(successResponse(summary));
    } catch (error) {
        res.status(500).json(errorResponse(`Failed to get damage summary: ${error}`));
    }
}
