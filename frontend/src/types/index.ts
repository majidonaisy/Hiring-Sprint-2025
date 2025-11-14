/**
 * Frontend Type Definitions
 * Mirrors backend types with additional UI-specific types
 */

// ============================================================================
// ENUMS & LITERALS (Same as backend)
// ============================================================================

export type VehicleAngle = 'front' | 'rear' | 'driver_side' | 'passenger_side' | 'roof';
export type AssessmentStatus =
    | 'pickup_in_progress'
    | 'pickup_complete'
    | 'return_in_progress'
    | 'completed';
export type AssessmentPhase = 'pickup' | 'return';
export type DamageSeverity = 'minor' | 'moderate' | 'severe';

// ============================================================================
// INTERFACES (Same as backend)
// ============================================================================

export interface Photo {
    id: string;
    assessmentId: string;
    angle: VehicleAngle;
    phase: AssessmentPhase;
    filename: string;
    storagePath?: string;
    data?: string; // Base64
    fileSize: number;
    uploadedAt: Date;
}

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

export interface AngleAnalysis {
    angle: VehicleAngle;
    pickupDamages: Damage[];
    returnDamages: Damage[];
    newDamages: Damage[];
    comparisonScore: number;
    analysisTimestamp: Date;
}

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

export interface ComparisonResult {
    assessmentId: string;
    angleAnalyses: Record<VehicleAngle, AngleAnalysis>;
    totalNewDamages: number;
    totalNewCost: number;
    overallSimilarityScore: number;
    comparedAt: Date;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    timestamp: Date;
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: PaginationMeta;
}

// ============================================================================
// REQUEST/RESPONSE TYPES (Same as backend)
// ============================================================================

export interface CreateAssessmentRequest {
    vehicleId: string;
    vehicleName: string;
}

export interface UploadPhotoRequest {
    angle: VehicleAngle;
    phase: AssessmentPhase;
    file: File | { data: string; filename: string };
}

export interface PhotoUploadResponse {
    photo: Photo;
    assessment: Assessment;
}

export interface AnalyzePickupResponse {
    assessment: Assessment;
    damagesByAngle: Record<VehicleAngle, Damage[]>;
}

export interface ComparisonResponse {
    assessment: Assessment;
    comparison: ComparisonResult;
    newDamagesByAngle: Record<VehicleAngle, Damage[]>;
}

// ============================================================================
// UI-SPECIFIC TYPES
// ============================================================================

export interface AngleWithStatus {
    angle: VehicleAngle;
    label: string;
    description: string;
    isComplete: boolean;
    icon?: string;
}

export const VEHICLE_ANGLES: Record<VehicleAngle, AngleWithStatus> = {
    front: {
        angle: 'front',
        label: 'Front',
        description: 'Bumper, headlights, hood, windshield',
        isComplete: false,
        icon: '🚗',
    },
    rear: {
        angle: 'rear',
        label: 'Rear',
        description: 'Bumper, taillights, trunk',
        isComplete: false,
        icon: '🚗',
    },
    driver_side: {
        angle: 'driver_side',
        label: 'Driver Side',
        description: 'Driver door, side panels, windows, mirror',
        isComplete: false,
        icon: '🪟',
    },
    passenger_side: {
        angle: 'passenger_side',
        label: 'Passenger Side',
        description: 'Passenger door, side panels, windows, mirror',
        isComplete: false,
        icon: '🪟',
    },
    roof: {
        angle: 'roof',
        label: 'Roof',
        description: 'Roof condition, sunroof, edges',
        isComplete: false,
        icon: '⬆️',
    },
};

/**
 * Store state for assessment workflow
 */
export interface AssessmentStoreState {
    // Current assessment
    assessment: Assessment | null;

    // UI state
    isLoading: boolean;
    error: string | null;
    currentPhase: AssessmentPhase;
    currentAngle: VehicleAngle | null;
    uploadProgress: number;
    analysisInProgress: boolean;

    // Actions
    setAssessment: (assessment: Assessment) => void;
    setCurrentAngle: (angle: VehicleAngle) => void;
    setCurrentPhase: (phase: AssessmentPhase) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setUploadProgress: (progress: number) => void;
    setAnalysisInProgress: (inProgress: boolean) => void;
    addPhotoToAssessment: (photo: Photo) => void;
    addDamageToAssessment: (damage: Damage) => void;
    updateAssessmentStatus: (status: AssessmentStatus) => void;
    reset: () => void;
}

/**
 * Component props types
 */
export interface PhotoUploadProps {
    angle: VehicleAngle;
    phase: AssessmentPhase;
    onUpload: (file: File) => void;
    isLoading?: boolean;
}

export interface AngleSelectorProps {
    angles: VehicleAngle[];
    currentAngle: VehicleAngle;
    completedAngles: VehicleAngle[];
    onSelectAngle: (angle: VehicleAngle) => void;
}

export interface DamagesByAngleProps {
    damages: Record<VehicleAngle, Damage[]>;
    phase: AssessmentPhase;
}

export interface AngleComparisonProps {
    angle: VehicleAngle;
    pickupPhoto?: Photo;
    returnPhoto?: Photo;
    pickupDamages: Damage[];
    newDamages: Damage[];
}
