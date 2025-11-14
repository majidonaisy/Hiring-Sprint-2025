/**
 * Assessment Model
 * Database operations for assessment records
 * Handles CRUD and angle-based queries
 */

import { prisma } from '@/config/database';
import {
    Assessment,
    AssessmentStatus,
    AssessmentPhase,
    VehicleAngle,
    Photo,
    Damage,
} from '@/types';

// ============================================================================
// CREATE OPERATIONS
// ============================================================================

/**
 * Create a new assessment
 */
export async function createAssessment(vehicleId: string, vehicleName: string): Promise<Assessment> {
    const assessment = await prisma.assessment.create({
        data: {
            vehicleId,
            vehicleName,
            status: 'pickup_in_progress',
        },
        include: {
            photos: true,
            damages: true,
        },
    });

    return formatAssessment(assessment);
}

// ============================================================================
// READ OPERATIONS
// ============================================================================

/**
 * Get assessment by ID with all related data
 */
export async function getAssessmentById(id: string): Promise<Assessment | null> {
    const assessment = await prisma.assessment.findUnique({
        where: { id },
        include: {
            photos: true,
            damages: true,
        },
    });

    return assessment ? formatAssessment(assessment) : null;
}

/**
 * Get all assessments with pagination
 */
export async function getAllAssessments(
    page: number = 1,
    limit: number = 10
): Promise<{ assessments: Assessment[]; total: number }> {
    const offset = (page - 1) * limit;

    const [assessments, total] = await Promise.all([
        prisma.assessment.findMany({
            skip: offset,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                photos: true,
                damages: true,
            },
        }),
        prisma.assessment.count(),
    ]);

    return {
        assessments: assessments.map(formatAssessment),
        total,
    };
}

/**
 * Get assessments by vehicle ID
 */
export async function getAssessmentsByVehicleId(vehicleId: string): Promise<Assessment[]> {
    const assessments = await prisma.assessment.findMany({
        where: { vehicleId },
        orderBy: { createdAt: 'desc' },
        include: {
            photos: true,
            damages: true,
        },
    });

    return assessments.map(formatAssessment);
}

/**
 * Get assessments by status
 */
export async function getAssessmentsByStatus(status: AssessmentStatus): Promise<Assessment[]> {
    const assessments = await prisma.assessment.findMany({
        where: { status },
        orderBy: { createdAt: 'desc' },
        include: {
            photos: true,
            damages: true,
        },
    });

    return assessments.map(formatAssessment);
}

// ============================================================================
// UPDATE OPERATIONS
// ============================================================================

/**
 * Update assessment status
 */
export async function updateAssessmentStatus(id: string, status: AssessmentStatus): Promise<Assessment | null> {
    const assessment = await prisma.assessment.update({
        where: { id },
        data: { status },
        include: {
            photos: true,
            damages: true,
        },
    });

    return formatAssessment(assessment);
}

/**
 * Update damage costs for assessment
 */
export async function updateAssessmentCosts(id: string, totalCost: number, newCost: number): Promise<void> {
    await prisma.assessment.update({
        where: { id },
        data: {
            totalDamageCost: totalCost,
            newDamageCost: newCost,
        },
    });
}

/**
 * Mark pickup as analyzed
 */
export async function markPickupAnalyzed(id: string): Promise<void> {
    await prisma.assessment.update({
        where: { id },
        data: { pickupAnalyzedAt: new Date() },
    });
}

/**
 * Mark return as analyzed
 */
export async function markReturnAnalyzed(id: string): Promise<void> {
    await prisma.assessment.update({
        where: { id },
        data: { returnAnalyzedAt: new Date() },
    });
}

/**
 * Mark assessment as completed
 */
export async function markAssessmentCompleted(id: string): Promise<void> {
    await prisma.assessment.update({
        where: { id },
        data: {
            status: 'completed',
            completedAt: new Date(),
        },
    });
}

// ============================================================================
// DELETE OPERATIONS
// ============================================================================

/**
 * Delete assessment by ID (cascades to photos and damages)
 */
export async function deleteAssessment(id: string): Promise<void> {
    await prisma.assessment.delete({
        where: { id },
    });
}

// ============================================================================
// VALIDATION & HELPER OPERATIONS
// ============================================================================

/**
 * Check if all 5 angles have been photographed for a phase
 */
export async function validateAllAnglesComplete(
    assessmentId: string,
    phase: AssessmentPhase
): Promise<boolean> {
    const requiredAngles: VehicleAngle[] = ['front', 'rear', 'driver_side', 'passenger_side', 'roof'];

    const photos = await prisma.photo.findMany({
        where: {
            assessmentId,
            phase,
        },
    });

    const photoAngles = new Set(photos.map((p) => p.angle));
    return requiredAngles.every((angle) => photoAngles.has(angle));
}

/**
 * Get missing angles for a phase
 */
export async function getMissingAngles(
    assessmentId: string,
    phase: AssessmentPhase
): Promise<VehicleAngle[]> {
    const requiredAngles: VehicleAngle[] = ['front', 'rear', 'driver_side', 'passenger_side', 'roof'];

    const photos = await prisma.photo.findMany({
        where: {
            assessmentId,
            phase,
        },
    });

    const photoAngles = new Set(photos.map((p) => p.angle));
    return requiredAngles.filter((angle) => !photoAngles.has(angle));
}

// ============================================================================
// HELPER FUNCTION
// ============================================================================

/**
 * Format database assessment record to Assessment type
 */
function formatAssessment(data: any): Assessment {
    const pickupPhotos: Record<VehicleAngle, Photo | null> = {
        front: null,
        rear: null,
        driver_side: null,
        passenger_side: null,
        roof: null,
    };

    const returnPhotos: Record<VehicleAngle, Photo | null> = {
        front: null,
        rear: null,
        driver_side: null,
        passenger_side: null,
        roof: null,
    };

    const pickupByAngle: Record<VehicleAngle, Damage[]> = {
        front: [],
        rear: [],
        driver_side: [],
        passenger_side: [],
        roof: [],
    };

    const returnByAngle: Record<VehicleAngle, Damage[]> = {
        front: [],
        rear: [],
        driver_side: [],
        passenger_side: [],
        roof: [],
    };

    const newByAngle: Record<VehicleAngle, Damage[]> = {
        front: [],
        rear: [],
        driver_side: [],
        passenger_side: [],
        roof: [],
    };

    (data.photos || []).forEach((photo: any) => {
        const photoObj: Photo = {
            id: photo.id,
            assessmentId: photo.assessmentId,
            angle: photo.angle as VehicleAngle,
            phase: photo.phase as AssessmentPhase,
            filename: photo.filename,
            storagePath: photo.storagePath,
            fileSize: photo.fileSize,
            uploadedAt: photo.createdAt,
        };

        if (photo.phase === 'pickup') {
            pickupPhotos[photo.angle as VehicleAngle] = photoObj;
        } else {
            returnPhotos[photo.angle as VehicleAngle] = photoObj;
        }
    });

    (data.damages || []).forEach((damage: any) => {
        const damageObj: Damage = {
            id: damage.id,
            assessmentId: damage.assessmentId,
            angle: damage.angle as VehicleAngle,
            phase: damage.phase as AssessmentPhase,
            description: damage.description,
            severity: damage.severity,
            location: damage.location,
            estimatedCost: damage.estimatedCost,
            aiConfidence: damage.aiConfidence,
            createdAt: damage.createdAt,
        };

        if (damage.phase === 'pickup') {
            pickupByAngle[damage.angle as VehicleAngle].push(damageObj);
        } else {
            returnByAngle[damage.angle as VehicleAngle].push(damageObj);
        }

        if (damage.isNew) {
            newByAngle[damage.angle as VehicleAngle].push(damageObj);
        }
    });

    const pickupCount = Object.values(pickupByAngle).reduce((sum, damages) => sum + damages.length, 0);
    const returnCount = Object.values(returnByAngle).reduce((sum, damages) => sum + damages.length, 0);
    const newCount = Object.values(newByAngle).reduce((sum, damages) => sum + damages.length, 0);

    return {
        id: data.id,
        vehicleId: data.vehicleId,
        vehicleName: data.vehicleName,
        status: data.status as AssessmentStatus,
        pickupPhotos,
        returnPhotos,
        pickupDamages: pickupByAngle,
        returnDamages: returnByAngle,
        newDamages: newByAngle,
        totalDamageCost: data.totalDamageCost,
        newDamageCost: data.newDamageCost,
        damageCounts: {
            pickup: pickupCount,
            return: returnCount,
            new: newCount,
        },
        timestamps: {
            createdAt: data.createdAt,
            pickupAnalyzedAt: data.pickupAnalyzedAt,
            returnAnalyzedAt: data.returnAnalyzedAt,
            completedAt: data.completedAt,
        },
    };
}
