/**
 * Inspection Service
 * Orchestrates the angle-based, 2-phase inspection workflow
 * Manages: photo uploads, damage analysis, angle-by-angle comparison
 */

import {
    createAssessment,
    getAssessmentById,
    updateAssessmentStatus,
    updateAssessmentCosts,
    markPickupAnalyzed,
    markReturnAnalyzed,
    markAssessmentCompleted,
    validateAllAnglesComplete,
    getMissingAngles,
} from '../models/assessment.js';

import {
    savePhoto,
    getPhotoByAngleAndPhase,
    deletePhotoByAngleAndPhase,
} from '../models/photo.js';

import {
    saveDamage,
    getDamagesByAngleAndPhase,
    getNewDamages,
    calculateTotalDamageCost,
    markDamageAsNew,
} from '../models/damage.js';

import { Assessment, VehicleAngle, AssessmentPhase, Damage, Photo } from '../types/index.js';
import { aiService } from './aiService.js';

// ============================================================================
// ASSESSMENT LIFECYCLE
// ============================================================================

/**
 * Start a new assessment (pickup phase)
 */
export async function startAssessment(vehicleId: string, vehicleName: string): Promise<Assessment> {
    const assessment = await createAssessment(vehicleId, vehicleName);
    return assessment;
}

/**
 * Get assessment by ID
 */
export async function getAssessment(assessmentId: string): Promise<Assessment | null> {
    return getAssessmentById(assessmentId);
}

// ============================================================================
// PHOTO UPLOAD & VALIDATION
// ============================================================================

/**
 * Upload a photo for a specific angle and phase
 * Validates that we don't overwrite existing photos
 */
export async function uploadPhotoByAngle(
    assessmentId: string,
    angle: VehicleAngle,
    phase: AssessmentPhase,
    filename: string,
    storagePath: string,
    fileSize: number
): Promise<Photo> {
    // Check if photo already exists for this angle/phase
    const existing = await getPhotoByAngleAndPhase(assessmentId, angle, phase);
    if (existing) {
        // Delete old photo first (will be replaced)
        await deletePhotoByAngleAndPhase(assessmentId, angle, phase);
    }

    // Save new photo
    const photo = await savePhoto(assessmentId, angle, phase, filename, storagePath, fileSize);
    return photo;
}

/**
 * Check if all 5 angles have been uploaded for a phase
 */
export async function checkPhaseComplete(assessmentId: string, phase: AssessmentPhase): Promise<boolean> {
    return validateAllAnglesComplete(assessmentId, phase);
}

/**
 * Get missing angles for a phase
 */
export async function getMissingAnglesForPhase(
    assessmentId: string,
    phase: AssessmentPhase
): Promise<VehicleAngle[]> {
    return getMissingAngles(assessmentId, phase);
}

// ============================================================================
// PICKUP PHASE: ANALYSIS
// ============================================================================

/**
 * Analyze all pickup photos and detect damages
 * Called after all 5 pickup angles are captured
 */
export async function analyzePickupPhotos(assessmentId: string): Promise<Assessment | null> {
    const assessment = await getAssessmentById(assessmentId);
    if (!assessment) return null;

    // Validate all angles are present
    const isComplete = await validateAllAnglesComplete(assessmentId, 'pickup');
    if (!isComplete) {
        throw new Error('Not all angles captured for pickup phase');
    }

    // Analyze each angle
    const angles: VehicleAngle[] = ['front', 'rear', 'driver_side', 'passenger_side', 'roof'];

    for (const angle of angles) {
        const photo = await getPhotoByAngleAndPhase(assessmentId, angle, 'pickup');
        if (!photo) continue;

        // Get AI analysis for this photo
        const analysis = await aiService.analyzePhoto(photo, angle, 'pickup');

        // Save detected damages
        for (const damage of analysis.detectedDamages) {
            await saveDamage(
                assessmentId,
                angle,
                'pickup',
                damage.description,
                damage.severity,
                damage.location,
                damage.estimatedCost,
                damage.confidence,
                photo.id,
                false, // Not new in pickup phase
                damage.boundingBox
            );
        }
    }

    // Mark pickup as analyzed and update status
    await markPickupAnalyzed(assessmentId);
    await updateAssessmentStatus(assessmentId, 'pickup_complete');

    // Calculate and store total costs
    const totalCost = await calculateTotalDamageCost(assessmentId);
    await updateAssessmentCosts(assessmentId, totalCost, 0); // newCost is 0 at pickup

    return getAssessmentById(assessmentId);
}

// ============================================================================
// RETURN PHASE: ANALYSIS & COMPARISON
// ============================================================================

/**
 * Analyze all return photos and detect damages
 * Called after all 5 return angles are captured
 */
export async function analyzeReturnPhotos(assessmentId: string): Promise<Assessment | null> {
    const assessment = await getAssessmentById(assessmentId);
    if (!assessment) return null;

    // Validate all angles are present
    const isComplete = await validateAllAnglesComplete(assessmentId, 'return');
    if (!isComplete) {
        throw new Error('Not all angles captured for return phase');
    }

    // Analyze each angle
    const angles: VehicleAngle[] = ['front', 'rear', 'driver_side', 'passenger_side', 'roof'];

    for (const angle of angles) {
        const photo = await getPhotoByAngleAndPhase(assessmentId, angle, 'return');
        if (!photo) continue;

        // Get AI analysis for this photo
        const analysis = await aiService.analyzePhoto(photo, angle, 'return');

        // Save detected damages
        for (const damage of analysis.detectedDamages) {
            await saveDamage(
                assessmentId,
                angle,
                'return',
                damage.description,
                damage.severity,
                damage.location,
                damage.estimatedCost,
                damage.confidence,
                photo.id,
                false, // Will be marked as new after comparison
                damage.boundingBox
            );
        }
    }

    // Mark return as analyzed
    await markReturnAnalyzed(assessmentId);

    return getAssessmentById(assessmentId);
}

// ============================================================================
// COMPARISON: PICKUP vs RETURN
// ============================================================================

/**
 * Compare pickup and return damages angle by angle
 * Identifies NEW damages (only in return, not in pickup)
 * Uses location-based matching with 50px threshold
 */
export async function comparePhotosAndDamages(assessmentId: string): Promise<Assessment | null> {
    const assessment = await getAssessmentById(assessmentId);
    if (!assessment) return null;

    const angles: VehicleAngle[] = ['front', 'rear', 'driver_side', 'passenger_side', 'roof'];
    let totalNewDamageCost = 0;

    // For each angle, compare pickup damages with return damages
    for (const angle of angles) {
        const pickupDamages = await getDamagesByAngleAndPhase(assessmentId, angle, 'pickup');
        const returnDamages = await getDamagesByAngleAndPhase(assessmentId, angle, 'return');

        // Find NEW damages: in return but not in pickup (or at different location)
        for (const returnDamage of returnDamages) {
            let isNew = true;

            // Check if there's a matching damage from pickup at similar location
            for (const pickupDamage of pickupDamages) {
                if (isDamageLocationMatch(returnDamage, pickupDamage)) {
                    isNew = false;
                    break;
                }
            }

            // Mark as new if no matching pickup damage found
            if (isNew) {
                await markDamageAsNew(returnDamage.id);
                totalNewDamageCost += returnDamage.estimatedCost;
            }
        }
    }

    // Calculate total damage cost
    const totalCost = await calculateTotalDamageCost(assessmentId);

    // Update assessment with cost information
    await updateAssessmentCosts(assessmentId, totalCost, totalNewDamageCost);

    // Mark assessment as completed
    await markAssessmentCompleted(assessmentId);

    return getAssessmentById(assessmentId);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if two damages are at the same location (within 50px threshold)
 * Used for pickup vs return comparison
 * 
 * Location format: "x:100,y:150" (pixel coordinates)
 */
function isDamageLocationMatch(damage1: Damage, damage2: Damage, threshold: number = 50): boolean {
    try {
        // Parse location strings: "x:100,y:150"
        const loc1 = parseLocation(damage1.location);
        const loc2 = parseLocation(damage2.location);

        if (!loc1 || !loc2) return false;

        // Calculate distance between two points
        const distance = Math.sqrt(Math.pow(loc1.x - loc2.x, 2) + Math.pow(loc1.y - loc2.y, 2));

        return distance <= threshold;
    } catch {
        return false;
    }
}

/**
 * Parse location string format: "x:100,y:150" → { x: 100, y: 150 }
 */
function parseLocation(location: string): { x: number; y: number } | null {
    try {
        const match = location.match(/x:(\d+),y:(\d+)/);
        if (!match) return null;

        return {
            x: parseInt(match[1], 10),
            y: parseInt(match[2], 10),
        };
    } catch {
        return null;
    }
}

// ============================================================================
// REPORTING & STATUS
// ============================================================================

/**
 * Get damage summary for an assessment
 */
export async function getDamageSummary(assessmentId: string): Promise<{
    pickupDamages: Record<string, number>;
    returnDamages: Record<string, number>;
    newDamages: Record<string, number>;
    costSummary: {
        totalCost: number;
        newCost: number;
    };
} | null> {
    const assessment = await getAssessmentById(assessmentId);
    if (!assessment) return null;

    // Count damages by angle
    const angles: VehicleAngle[] = ['front', 'rear', 'driver_side', 'passenger_side', 'roof'];
    const pickupDamages: Record<string, number> = {};
    const returnDamages: Record<string, number> = {};
    const newDamages: Record<string, number> = {};

    for (const angle of angles) {
        const pickup = await getDamagesByAngleAndPhase(assessmentId, angle, 'pickup');
        const returned = await getDamagesByAngleAndPhase(assessmentId, angle, 'return');
        const newDamagesForAngle = await getNewDamages(assessmentId, angle);

        pickupDamages[angle] = pickup.length;
        returnDamages[angle] = returned.length;
        newDamages[angle] = newDamagesForAngle.length;
    }

    return {
        pickupDamages,
        returnDamages,
        newDamages,
        costSummary: {
            totalCost: assessment.totalDamageCost,
            newCost: assessment.newDamageCost,
        },
    };
}

/**
 * Get phase status
 */
export async function getPhaseStatus(
    assessmentId: string,
    phase: AssessmentPhase
): Promise<{
    phase: AssessmentPhase;
    isComplete: boolean;
    capturedAngles: VehicleAngle[];
    missingAngles: VehicleAngle[];
} | null> {
    const isComplete = await validateAllAnglesComplete(assessmentId, phase);
    const missingAngles = await getMissingAngles(assessmentId, phase);
    const angles: VehicleAngle[] = ['front', 'rear', 'driver_side', 'passenger_side', 'roof'];
    const capturedAngles = angles.filter((a) => !missingAngles.includes(a));

    return {
        phase,
        isComplete,
        capturedAngles: capturedAngles as VehicleAngle[],
        missingAngles,
    };
}
