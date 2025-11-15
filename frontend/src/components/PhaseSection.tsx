/**
 * PhaseSection Component
 * Displays all angle uploaders for a specific phase (pickup/return)
 */

import { VehicleAngle, AssessmentPhase } from '../types';
import { PhotoUploader } from './PhotoUploader';
import { Button } from './ui/button';

interface PhaseSectionProps {
    phase: AssessmentPhase;
    angles: VehicleAngle[];
    onPhotoUpload: (angle: VehicleAngle, file: File) => void;
    completedAngles: VehicleAngle[];
    loadingAngle: VehicleAngle | null;
    uploadErrors: Record<VehicleAngle, string | null>;
    onAnalyze?: () => void;
    isAnalyzing?: boolean;
}

export function PhaseSection({
    phase,
    angles,
    onPhotoUpload,
    completedAngles,
    loadingAngle,
    uploadErrors,
    onAnalyze,
    isAnalyzing = false,
}: PhaseSectionProps) {
    const phaseLabels = {
        pickup: {
            title: '📍 Pickup Inspection',
            description: 'Upload photos of the vehicle at pickup',
            color: 'bg-blue-50',
            borderColor: 'border-blue-200',
            buttonColor: 'bg-blue-600 hover:bg-blue-700',
        },
        return: {
            title: '📤 Return Inspection',
            description: 'Upload photos of the vehicle upon return',
            color: 'bg-green-50',
            borderColor: 'border-green-200',
            buttonColor: 'bg-green-600 hover:bg-green-700',
        },
    };

    const config = phaseLabels[phase];
    const completionPercentage = Math.round((completedAngles.length / angles.length) * 100);
    const isComplete = completedAngles.length === angles.length;

    return (
        <div className={`space-y-6 p-6 rounded-lg border ${config.borderColor} ${config.color}`}>
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold text-gray-900">{config.title}</h2>
                <p className="text-gray-600 mt-1">{config.description}</p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Progress</span>
                    <span className="text-sm font-semibold text-gray-900">
                        {completedAngles.length} / {angles.length} angles
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300"
                        style={{ width: `${completionPercentage}%` }}
                    />
                </div>
            </div>

            {/* Photo Uploaders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {angles.map((angle) => (
                    <PhotoUploader
                        key={angle}
                        angle={angle}
                        onUpload={(file) => onPhotoUpload(angle, file)}
                        isLoading={loadingAngle === angle}
                        isComplete={completedAngles.includes(angle)}
                        uploadError={uploadErrors[angle]}
                    />
                ))}
            </div>

            {/* Completion Status & Action */}
            {isComplete && (
                <div className="flex items-center justify-between p-4 bg-white border border-green-300 rounded-lg">
                    <p className="text-green-800 font-medium">✅ All angles uploaded!</p>
                    {onAnalyze && (
                        <Button
                            onClick={onAnalyze}
                            disabled={isAnalyzing}
                            className={config.buttonColor}
                        >
                            {isAnalyzing ? 'Analyzing...' : 'Analyze'}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
