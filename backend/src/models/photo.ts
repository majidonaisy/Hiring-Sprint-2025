/**
 * Photo Model
 * Database operations for photo records
 * Handles angle-based photo storage and retrieval
 */

import { prisma } from '@/config/database';
import { Photo, VehicleAngle, AssessmentPhase } from '@/types';

/**
 * Convert database row to Photo object
 */
function formatPhoto(data: any): Photo {
    return {
        id: data.id,
        assessmentId: data.assessmentId,
        angle: data.angle,
        phase: data.phase,
        filename: data.filename,
        storagePath: data.storagePath,
        fileSize: data.fileSize,
        uploadedAt: data.createdAt,
    };
}

// ============================================================================
// CREATE OPERATIONS
// ============================================================================

/**
 * Save a photo for a specific angle and phase
 */
export async function savePhoto(
    assessmentId: string,
    angle: VehicleAngle,
    phase: AssessmentPhase,
    filename: string,
    storagePath: string,
    fileSize: number
): Promise<Photo> {
    const photo = await prisma.photo.create({
        data: {
            assessmentId,
            angle,
            phase,
            filename,
            storagePath,
            fileSize,
        },
    });

    return formatPhoto(photo);
}

// ============================================================================
// READ OPERATIONS
// ============================================================================

/**
 * Get photo by ID
 */
export async function getPhotoById(id: string): Promise<Photo | null> {
    const photo = await prisma.photo.findUnique({
        where: { id },
    });

    return photo ? formatPhoto(photo) : null;
}

/**
 * Get photo for specific angle and phase
 */
export async function getPhotoByAngleAndPhase(
    assessmentId: string,
    angle: VehicleAngle,
    phase: AssessmentPhase
): Promise<Photo | null> {
    const photo = await prisma.photo.findUnique({
        where: {
            assessmentId_angle_phase: {
                assessmentId,
                angle,
                phase,
            },
        },
    });

    return photo ? formatPhoto(photo) : null;
}

/**
 * Get all photos for an assessment and phase
 */
export async function getPhotosByPhase(
    assessmentId: string,
    phase: AssessmentPhase
): Promise<Photo[]> {
    const photos = await prisma.photo.findMany({
        where: {
            assessmentId,
            phase,
        },
        orderBy: { angle: 'asc' },
    });

    return photos.map(formatPhoto);
}

/**
 * Get all photos for an assessment
 */
export async function getPhotosByAssessment(assessmentId: string): Promise<Photo[]> {
    const photos = await prisma.photo.findMany({
        where: { assessmentId },
        orderBy: [{ phase: 'asc' }, { angle: 'asc' }],
    });

    return photos.map(formatPhoto);
}

// ============================================================================
// UPDATE OPERATIONS
// ============================================================================

/**
 * Update photo storage path (e.g., when moving from temp to cloud)
 */
export async function updatePhotoStoragePath(id: string, storagePath: string): Promise<Photo | null> {
    const photo = await prisma.photo.update({
        where: { id },
        data: { storagePath },
    });

    return formatPhoto(photo);
}

// ============================================================================
// DELETE OPERATIONS
// ============================================================================

/**
 * Delete photo by ID
 */
export async function deletePhoto(id: string): Promise<void> {
    await prisma.photo.delete({
        where: { id },
    });
}

/**
 * Delete photo for specific angle and phase
 */
export async function deletePhotoByAngleAndPhase(
    assessmentId: string,
    angle: VehicleAngle,
    phase: AssessmentPhase
): Promise<void> {
    await prisma.photo.delete({
        where: {
            assessmentId_angle_phase: {
                assessmentId,
                angle,
                phase,
            },
        },
    });
}

/**
 * Delete all photos for an assessment
 */
export async function deletePhotosByAssessment(assessmentId: string): Promise<void> {
    await prisma.photo.deleteMany({
        where: { assessmentId },
    });
}
