/**
 * Damage Model
 * Database operations for damage records
 * Handles angle-based damage storage and retrieval
 */

import { prisma } from '../config/database.js';
import { Damage, VehicleAngle, AssessmentPhase, DamageSeverity } from '../types/index.js';

// ============================================================================
// CREATE OPERATIONS
// ============================================================================

/**
 * Save a damage record
 */
export async function saveDamage(
    assessmentId: string,
    angle: VehicleAngle,
    phase: AssessmentPhase,
    description: string,
    severity: DamageSeverity,
    location: string,
    estimatedCost: number,
    aiConfidence: number,
    photoId?: string,
    isNew: boolean = false,
    boundingBox?: { x: number; y: number; width: number; height: number }
): Promise<Damage> {
    const damage = await prisma.damage.create({
        data: {
            assessmentId,
            angle,
            phase,
            photoId,
            description,
            severity,
            location,
            estimatedCost,
            aiConfidence,
            isNew,
            boundingBoxX: boundingBox?.x,
            boundingBoxY: boundingBox?.y,
            boundingBoxWidth: boundingBox?.width,
            boundingBoxHeight: boundingBox?.height,
        },
    });

    return formatDamage(damage);
}

// ============================================================================
// READ OPERATIONS
// ============================================================================

/**
 * Get damage by ID
 */
export async function getDamageById(id: string): Promise<Damage | null> {
    const damage = await prisma.damage.findUnique({
        where: { id },
    });

    return damage ? formatDamage(damage) : null;
}

/**
 * Get damages for a specific angle and phase
 */
export async function getDamagesByAngleAndPhase(
    assessmentId: string,
    angle: VehicleAngle,
    phase: AssessmentPhase
): Promise<Damage[]> {
    const damages = await prisma.damage.findMany({
        where: {
            assessmentId,
            angle,
            phase,
        },
        orderBy: { createdAt: 'asc' },
    });

    return damages.map(formatDamage);
}

/**
 * Get all damages for a phase
 */
export async function getDamagesByPhase(
    assessmentId: string,
    phase: AssessmentPhase
): Promise<Damage[]> {
    const damages = await prisma.damage.findMany({
        where: {
            assessmentId,
            phase,
        },
        orderBy: [{ angle: 'asc' }, { createdAt: 'asc' }],
    });

    return damages.map(formatDamage);
}

/**
 * Get all damages for an assessment
 */
export async function getDamagesByAssessment(assessmentId: string): Promise<Damage[]> {
    const damages = await prisma.damage.findMany({
        where: { assessmentId },
        orderBy: [{ phase: 'asc' }, { angle: 'asc' }, { createdAt: 'asc' }],
    });

    return damages.map(formatDamage);
}

/**
 * Get new damages (flagged as isNew = true)
 */
export async function getNewDamages(
    assessmentId: string,
    angle?: VehicleAngle
): Promise<Damage[]> {
    const damages = await prisma.damage.findMany({
        where: {
            assessmentId,
            isNew: true,
            ...(angle && { angle }),
        },
        orderBy: angle ? { createdAt: 'asc' } : [{ angle: 'asc' }, { createdAt: 'asc' }],
    });

    return damages.map(formatDamage);
}

/**
 * Get damages by severity
 */
export async function getDamagesBySeverity(
    assessmentId: string,
    severity: DamageSeverity
): Promise<Damage[]> {
    const damages = await prisma.damage.findMany({
        where: {
            assessmentId,
            severity,
        },
        orderBy: [{ angle: 'asc' }, { createdAt: 'asc' }],
    });

    return damages.map(formatDamage);
}

// ============================================================================
// UPDATE OPERATIONS
// ============================================================================

/**
 * Mark damage as new
 */
export async function markDamageAsNew(id: string): Promise<Damage | null> {
    const damage = await prisma.damage.update({
        where: { id },
        data: { isNew: true },
    });

    return formatDamage(damage);
}

/**
 * Update damage information
 */
export async function updateDamage(
    id: string,
    description?: string,
    severity?: DamageSeverity,
    location?: string,
    estimatedCost?: number,
    aiConfidence?: number
): Promise<Damage | null> {
    const damage = await prisma.damage.update({
        where: { id },
        data: {
            ...(description && { description }),
            ...(severity && { severity }),
            ...(location && { location }),
            ...(estimatedCost !== undefined && { estimatedCost }),
            ...(aiConfidence !== undefined && { aiConfidence }),
        },
    });

    return formatDamage(damage);
}

// ============================================================================
// DELETE OPERATIONS
// ============================================================================

/**
 * Delete damage by ID
 */
export async function deleteDamage(id: string): Promise<void> {
    await prisma.damage.delete({
        where: { id },
    });
}

/**
 * Delete damages for a specific angle and phase
 */
export async function deleteDamagesByAngleAndPhase(
    assessmentId: string,
    angle: VehicleAngle,
    phase: AssessmentPhase
): Promise<void> {
    await prisma.damage.deleteMany({
        where: {
            assessmentId,
            angle,
            phase,
        },
    });
}

/**
 * Delete all damages for an assessment
 */
export async function deleteDamagesByAssessment(assessmentId: string): Promise<void> {
    await prisma.damage.deleteMany({
        where: { assessmentId },
    });
}

/**
 * Calculate total damage cost for assessment
 */
export async function calculateTotalDamageCost(assessmentId: string): Promise<number> {
    const result = await prisma.damage.aggregate({
        where: { assessmentId },
        _sum: { estimatedCost: true },
    });

    return result._sum.estimatedCost || 0;
}

/**
 * Calculate new damage cost for assessment
 */
export async function calculateNewDamageCost(assessmentId: string): Promise<number> {
    const result = await prisma.damage.aggregate({
        where: {
            assessmentId,
            isNew: true,
        },
        _sum: { estimatedCost: true },
    });

    return result._sum.estimatedCost || 0;
}

// ============================================================================
// HELPER FUNCTION
// ============================================================================

/**
 * Format database damage record to Damage type
 */
function formatDamage(data: any): Damage {
    const boundingBox =
        data.boundingBoxX !== null &&
            data.boundingBoxY !== null &&
            data.boundingBoxWidth !== null &&
            data.boundingBoxHeight !== null
            ? {
                x: data.boundingBoxX,
                y: data.boundingBoxY,
                width: data.boundingBoxWidth,
                height: data.boundingBoxHeight,
            }
            : undefined;

    return {
        id: data.id,
        assessmentId: data.assessmentId,
        angle: data.angle as VehicleAngle,
        phase: data.phase as AssessmentPhase,
        description: data.description,
        severity: data.severity,
        location: data.location,
        estimatedCost: data.estimatedCost,
        aiConfidence: data.aiConfidence,
        boundingBox,
        createdAt: data.createdAt,
    };
}
