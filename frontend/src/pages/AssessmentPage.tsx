/**
 * AssessmentPage Component
 * Main assessment workflow page
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAssessment } from '../hooks/useAssessment';
import { VehicleAngle, AssessmentPhase } from '../types';
import { AssessmentCreationModal } from '../components/AssessmentCreationModal';
import { PhaseSection } from '../components/PhaseSection';
import { Button } from '../components/ui/button';
import { ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';

const ANGLES: VehicleAngle[] = ['front', 'rear', 'driver_side', 'passenger_side', 'roof'];

interface AssessmentPageProps {
    assessmentIdParam?: string;
}

export function AssessmentPage({ assessmentIdParam }: AssessmentPageProps) {
    const { assessmentId: paramAssessmentId } = useParams<{ assessmentId?: string }>();
    const navigate = useNavigate();

    const assessmentId = assessmentIdParam || paramAssessmentId;
    const {
        assessment,
        loading,
        error,
        createAssessment,
        fetchAssessment,
        uploadPhoto,
        analyzePickup,
        analyzeReturn,
        comparePhotos,
    } = useAssessment();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(!assessmentId);
    const [currentPhase, setCurrentPhase] = useState<AssessmentPhase>('pickup');
    const [uploadErrors, setUploadErrors] = useState<Record<VehicleAngle, string | null>>({
        front: null,
        rear: null,
        driver_side: null,
        passenger_side: null,
        roof: null,
    });
    const [loadingAngle, setLoadingAngle] = useState<VehicleAngle | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Fetch assessment if ID provided
    useEffect(() => {
        if (assessmentId && !assessment) {
            fetchAssessment(assessmentId);
        }
    }, [assessmentId, assessment, fetchAssessment]);

    // Determine completed angles for current phase
    const getCompletedAngles = (): VehicleAngle[] => {
        if (!assessment) return [];

        const phasePhotos =
            currentPhase === 'pickup'
                ? assessment.pickupPhotos
                : assessment.returnPhotos;

        return ANGLES.filter((angle) => phasePhotos?.[angle] !== null);
    };

    const completedAngles = getCompletedAngles();

    // Handle photo upload
    const handlePhotoUpload = async (angle: VehicleAngle, file: File) => {
        if (!assessment?.id) return;

        setLoadingAngle(angle);
        setUploadErrors((prev) => ({ ...prev, [angle]: null }));

        const toastId = toast.loading(`Uploading ${angle} photo...`);

        try {
            await uploadPhoto(assessment.id, angle, currentPhase, file);
            toast.success(`${angle} photo uploaded successfully!`, { id: toastId });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Upload failed';
            setUploadErrors((prev) => ({ ...prev, [angle]: errorMessage }));
            toast.error(`Upload failed: ${errorMessage}`, { id: toastId });
        } finally {
            setLoadingAngle(null);
        }
    };

    // Handle pickup analysis
    const handleAnalyzePickup = async () => {
        if (!assessment?.id) return;

        setIsAnalyzing(true);
        const toastId = toast.loading('Analyzing pickup photos with AI...');

        try {
            await analyzePickup(assessment.id);
            toast.success('✅ Pickup analysis complete! Moving to return phase...', { id: toastId });
            // Move to return phase after successful analysis
            setCurrentPhase('return');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
            toast.error(`Analysis failed: ${errorMessage}`, { id: toastId });
            console.error('Analysis failed:', err);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Handle return analysis
    const handleAnalyzeReturn = async () => {
        if (!assessment?.id) return;

        setIsAnalyzing(true);
        const toastId = toast.loading('Analyzing return photos and comparing damages...');

        try {
            await analyzeReturn(assessment.id);
            toast.success('✅ Return analysis complete!', { id: toastId });

            // Compare photos
            const compareToastId = toast.loading('Generating comparison report...');
            await comparePhotos(assessment.id);
            toast.success('📊 Report generated! Redirecting...', { id: compareToastId });

            // Navigate to report
            setTimeout(() => navigate(`/report/${assessment.id}`), 1000);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
            toast.error(`Analysis failed: ${errorMessage}`, { id: toastId });
            console.error('Analysis failed:', err);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Handle create assessment
    const handleCreateAssessment = async (vehicleId: string, vehicleName: string) => {
        const toastId = toast.loading(`Creating assessment for ${vehicleName}...`);

        try {
            await createAssessment(vehicleId, vehicleName);
            toast.success(`✅ Assessment created for ${vehicleName}!`, { id: toastId });
            setIsCreateModalOpen(false);
            // URL will update automatically via effect
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create assessment';
            toast.error(`Failed to create assessment: ${errorMessage}`, { id: toastId });
            console.error('Failed to create assessment:', err);
        }
    };

    // Show create modal if no assessment
    if (!assessment) {
        return (
            <>
                <AssessmentCreationModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onCreate={handleCreateAssessment}
                    isLoading={loading}
                />
                <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
                    <div className="text-center">
                        <div className="inline-block p-12 bg-white rounded-lg shadow-lg">
                            <h1 className="text-3xl font-bold text-gray-900 mb-4">
                                🚗 Vehicle Assessment
                            </h1>
                            <p className="text-gray-600 mb-8">
                                Start a new inspection to begin
                            </p>
                            <Button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700"
                                size="lg"
                            >
                                Create New Assessment
                            </Button>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                {assessment.vehicleName}
                            </h1>
                            <p className="text-gray-600 mt-1">
                                ID: {assessment.vehicleId} • Status: {assessment.status}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-gray-600">Assessment ID</div>
                            <div className="text-lg font-mono font-bold text-gray-900">
                                {assessment.id.slice(0, 8)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {error}
                    </div>
                )}

                {/* Phase Navigation */}
                <div className="bg-white rounded-lg shadow-md p-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setCurrentPhase('pickup')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${currentPhase === 'pickup'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            <span>📍 Pickup</span>
                            {completedAngles.length > 0 && currentPhase === 'pickup' && (
                                <CheckCircle2 size={18} />
                            )}
                        </button>

                        <ArrowRight className="text-gray-400" size={20} />

                        <button
                            onClick={() => setCurrentPhase('return')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${currentPhase === 'return'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            <span>📤 Return</span>
                        </button>
                    </div>
                </div>

                {/* Phase Content */}
                <PhaseSection
                    phase={currentPhase}
                    angles={ANGLES}
                    onPhotoUpload={handlePhotoUpload}
                    completedAngles={completedAngles}
                    loadingAngle={loadingAngle}
                    uploadErrors={uploadErrors}
                    onAnalyze={
                        currentPhase === 'pickup' ? handleAnalyzePickup : handleAnalyzeReturn
                    }
                    isAnalyzing={isAnalyzing}
                />

                {/* Phase Actions */}
                {completedAngles.length === ANGLES.length && (
                    <div className="flex justify-between items-center">
                        {currentPhase === 'return' && (
                            <Button
                                onClick={() => setCurrentPhase('pickup')}
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                <ArrowLeft size={18} />
                                Back to Pickup
                            </Button>
                        )}
                        <div className="flex-1" />
                    </div>
                )}

                {/* Loading Indicator */}
                {loading && (
                    <div className="flex items-center justify-center gap-3 p-4 bg-blue-50 rounded-lg">
                        <div className="animate-spin">
                            <div className="h-6 w-6 border-3 border-blue-500 border-t-transparent rounded-full" />
                        </div>
                        <span className="text-blue-700 font-medium">Processing...</span>
                    </div>
                )}
            </div>
        </div>
    );
}
