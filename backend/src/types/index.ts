/**
 * Shared Type Definitions
 * Types used across both frontend and backend
 */

/**
 * Inspection Status Enum
 */
export enum InspectionStatus {
    ACTIVE = 'active',
    COMPLETED = 'completed',
    ARCHIVED = 'archived',
}

/**
 * Damage Severity Enum
 */
export enum DamageSeverity {
    MINOR = 'minor',
    MODERATE = 'moderate',
    SEVERE = 'severe',
}

/**
 * Image Type Enum
 */
export enum ImageType {
    PICKUP = 'pickup',
    RETURN = 'return',
}

/**
 * Inspection entity
 */
export interface Inspection {
    id: string;
    vehicleId: string;
    vehicleName?: string;
    pickupDate: Date;
    returnDate?: Date;
    status: InspectionStatus;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Image metadata
 */
export interface ImageMetadata {
    id: string;
    inspectionId: string;
    imageType: ImageType;
    originalFilename: string;
    storedPath?: string;
    s3Url?: string;
    fileSize: number;
    createdAt: Date;
}

/**
 * Detected damage information
 */
export interface DamageDetection {
    id: string;
    inspectionId: string;
    imageId: string;
    description: string;
    severity: DamageSeverity;
    estimatedCost: number;
    location: string;
    aiConfidence: number;
    createdAt: Date;
}

/**
 * Comparison result
 */
export interface ComparisonResult {
    id: string;
    inspectionId: string;
    pickupImageId?: string;
    returnImageId?: string;
    newDamagesCount: number;
    totalEstimatedCost: number;
    comparisonData?: Record<string, any>;
    createdAt: Date;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
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
