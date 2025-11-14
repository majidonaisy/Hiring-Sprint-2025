/**
 * Shared Type Definitions
 * Core types for angle-based vehicle inspection system
 */

// ============================================================================
// ENUMS & LITERALS
// ============================================================================

/**
 * Vehicle angles for structured photo capture
 * Represents the 5 standard angles for vehicle inspection
 */
export type VehicleAngle = 'front' | 'rear' | 'driver_side' | 'passenger_side' | 'roof';

/**
 * Assessment lifecycle status
 */
export type AssessmentStatus =
    | 'pickup_in_progress'
    | 'pickup_complete'
    | 'return_in_progress'
    | 'completed';

/**
 * Phase of assessment (pickup or return)
 */
export type AssessmentPhase = 'pickup' | 'return';

/**
 * Damage severity levels
 */
export type DamageSeverity = 'minor' | 'moderate' | 'severe';

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Photo metadata and storage reference
 */
export interface Photo {
    id: string;
    assessmentId: string;
    angle: VehicleAngle;
    phase: AssessmentPhase;
    filename: string;
    storagePath?: string;
    data?: string;
    fileSize: number;
    uploadedAt: Date;
}

/**
 * Individual damage detected by AI or recorded manually
 */
export interface Damage {
    id: string;
    assessmentId: string;
    angle: VehicleAngle;
    phase: AssessmentPhase;
    description: string;
    severity: DamageSeverity;
    location: string;
    estimatedCost: number;
    aiConfidence: number;
    createdAt: Date;
}

/**
 * Analysis results for a single angle
 */
export interface AngleAnalysis {
    angle: VehicleAngle;
    pickupDamages: Damage[];
    returnDamages: Damage[];
    newDamages: Damage[];
    comparisonScore: number;
    analysisTimestamp: Date;
}

/**
 * Complete assessment of vehicle condition
 */
export interface Assessment {
    id: string;
    vehicleId: string;
    vehicleName: string;
    status: AssessmentStatus;
    pickupPhotos: Record<VehicleAngle, Photo | null>;
    returnPhotos: Record<VehicleAngle, Photo | null>;
    pickupDamages: Record<VehicleAngle, Damage[]>;
    returnDamages: Record<VehicleAngle, Damage[]>;
    newDamages: Record<VehicleAngle, Damage[]>;
    totalDamageCost: number;
    newDamageCost: number;
    damageCounts: {
        pickup: number;
        return: number;
        new: number;
    };
    timestamps: {
        createdAt: Date;
        pickupAnalyzedAt?: Date;
        returnAnalyzedAt?: Date;
        completedAt?: Date;
    };
}

/**
 * Comparison result between pickup and return phases
 */
export interface ComparisonResult {
    assessmentId: string;
    angleAnalyses: Record<VehicleAngle, AngleAnalysis>;
    totalNewDamages: number;
    totalNewCost: number;
    overallSimilarityScore: number;
    comparedAt: Date;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    timestamp: Date;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
    data: T[];
    pagination: PaginationMeta;
}
