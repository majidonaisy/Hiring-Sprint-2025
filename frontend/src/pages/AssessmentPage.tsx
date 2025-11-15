/**
 * AssessmentPage Component (Simplified)
 * Clean, professional workflow for vehicle inspections
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAssessment } from '../hooks/useAssessment';
import { VehicleAngle, AssessmentPhase, Assessment } from '../types';
import { AssessmentCreationModal } from '../components/AssessmentCreationModal';
import { PhotoUploader } from '../components/PhotoUploader';
import { Button } from '../components/ui/button';
import { ArrowRight, ArrowLeft, Loader } from 'lucide-react';

const ANGLES: VehicleAngle[] = ['front', 'rear', 'driver_side', 'passenger_side', 'roof'];

// Helper to save assessment to localStorage
const saveAssessmentLocally = (assessment: Assessment) => {
    try {
        const saved = localStorage.getItem('assessments');
        const assessments = saved ? JSON.parse(saved) : [];
        const index = assessments.findIndex((a: any) => a.id === assessment.id);
        if (index >= 0) {
            assessments[index] = assessment;
        } else {
            assessments.push(assessment);
        }
        localStorage.setItem('assessments', JSON.stringify(assessments));
    } catch (err) {
        console.error('Failed to save assessment locally:', err);
    }
};

export function AssessmentPage() {
    const { assessmentId } = useParams<{ assessmentId?: string }>();
    const navigate = useNavigate();

    const {
        assessment,
        loading,
        fetchAssessment,
        uploadPhoto,
        analyzePickup,
        analyzeReturn,
        comparePhotos,
        createAssessment,
    } = useAssessment();

    const [currentPhase, setCurrentPhase] = useState<AssessmentPhase>('pickup');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(!assessmentId);
    const [uploadErrors, setUploadErrors] = useState<Record<VehicleAngle, string | null>>({
        front: null,
        rear: null,
        driver_side: null,
        passenger_side: null,
        roof: null,
    });
    const [loadingAngle, setLoadingAngle] = useState<VehicleAngle | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        if (assessmentId && !assessment) {
            fetchAssessment(assessmentId);
        }
    }, [assessmentId, assessment, fetchAssessment]);

    useEffect(() => {
        if (assessment) {
            saveAssessmentLocally(assessment);
        }
    }, [assessment]);

    const getCompletedAngles = (): VehicleAngle[] => {
        if (!assessment) return [];
        const phasePhotos =
            currentPhase === 'pickup'
                ? assessment.pickupPhotos
                : assessment.returnPhotos;
        return ANGLES.filter((angle) => phasePhotos?.[angle] !== null);
    };

    const completedAngles = getCompletedAngles();
    const allAnglesComplete = completedAngles.length === ANGLES.length;
    const isAssessmentComplete = assessment?.status === 'completed';

    const handleActionButton = async () => {
        // If assessment is complete, navigate to report
        if (isAssessmentComplete) {
            navigate(`/report/${assessment?.id}`);
            return;
        }

        // Otherwise, analyze the current phase
        if (currentPhase === 'pickup') {
            await handleAnalyzePickup();
        } else {
            await handleAnalyzeReturn();
        }
    };

    const getActionButtonLabel = () => {
        if (isAssessmentComplete) {
            return 'View Report';
        }
        return currentPhase === 'pickup' ? 'Analyze Pickup' : 'Analyze Return';
    };

    const handleCreateAssessment = async (vehicleId: string, vehicleName: string) => {
        const toastId = toast.loading('Creating assessment...');
        try {
            await createAssessment(vehicleId, vehicleName);
            toast.success('Assessment created', { id: toastId });
            setIsCreateModalOpen(false);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create assessment';
            toast.error(`Failed: ${errorMessage}`, { id: toastId });
        }
    };

    const handlePhotoUpload = async (angle: VehicleAngle, file: File) => {
        if (!assessment?.id) return;
        setLoadingAngle(angle);
        setUploadErrors((prev) => ({ ...prev, [angle]: null }));
        const toastId = toast.loading(`Uploading photo...`);
        try {
            await uploadPhoto(assessment.id, angle, currentPhase, file);
            toast.success(`Photo uploaded`, { id: toastId });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Upload failed';
            setUploadErrors((prev) => ({ ...prev, [angle]: errorMessage }));
            toast.error(`Upload failed: ${errorMessage}`, { id: toastId });
        } finally {
            setLoadingAngle(null);
        }
    };

    const handleAnalyzePickup = async () => {
        if (!assessment?.id) return;
        setIsAnalyzing(true);
        const toastId = toast.loading('Analyzing photos...');
        try {
            await analyzePickup(assessment.id);
            toast.success('Analysis complete', { id: toastId });
            setCurrentPhase('return');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
            toast.error(`Analysis failed: ${errorMessage}`, { id: toastId });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleAnalyzeReturn = async () => {
        if (!assessment?.id) return;
        setIsAnalyzing(true);
        const toastId = toast.loading('Analyzing and comparing...');
        try {
            await analyzeReturn(assessment.id);
            toast.success('Analysis complete', { id: toastId });
            await comparePhotos(assessment.id);
            setTimeout(() => navigate(`/report/${assessment.id}`), 1000);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
            toast.error(`Analysis failed: ${errorMessage}`, { id: toastId });
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (!assessment) {
        return (
            <>
                <AssessmentCreationModal
                    isOpen={isCreateModalOpen}
                    onClose={() => {
                        setIsCreateModalOpen(false);
                        navigate('/');
                    }}
                    onCreate={handleCreateAssessment}
                    isLoading={loading}
                />
                {!isCreateModalOpen && (
                    <div className="min-h-screen bg-white flex items-center justify-center p-4">
                        {loading ? (
                            <div className="text-center">
                                <Loader className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">Loading assessment...</p>
                            </div>
                        ) : (
                            <div className="text-center max-w-md">
                                <h1 className="text-3xl font-semibold text-gray-900 mb-2">
                                    Vehicle Assessment
                                </h1>
                                <p className="text-gray-600 mb-8">
                                    Create a new assessment to begin inspecting a vehicle
                                </p>
                                <Button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="bg-gray-900 text-white hover:bg-gray-800 w-full"
                                >
                                    Start New Assessment
                                </Button>
                                <Button
                                    onClick={() => navigate('/')}
                                    variant="outline"
                                    className="w-full mt-3"
                                >
                                    Back to Assessments
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Button
                        onClick={() => navigate('/')}
                        variant="ghost"
                        className="mb-4 text-gray-600"
                    >
                        ← Back
                    </Button>
                    <h1 className="text-3xl font-semibold text-gray-900">
                        {assessment.vehicleName}
                    </h1>
                    <p className="text-sm text-gray-600 mt-2">
                        {isAssessmentComplete ? (
                            'Assessment Complete'
                        ) : (
                            <>
                                {currentPhase === 'pickup' ? 'Pickup Phase' : 'Return Phase'} • {completedAngles.length}/{ANGLES.length} photos
                            </>
                        )}
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Progress Bar */}
                <div className="mb-12">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">Progress</span>
                        <span className="text-sm text-gray-600">{completedAngles.length} of {ANGLES.length}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-gray-900 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(completedAngles.length / ANGLES.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Photos Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-12">
                    {ANGLES.map((angle) => (
                        <PhotoUploader
                            key={angle}
                            angle={angle}
                            onUpload={(file: File) => handlePhotoUpload(angle, file)}
                            isLoading={loadingAngle === angle}
                            isComplete={completedAngles.includes(angle)}
                            uploadError={uploadErrors[angle]}
                        />
                    ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 justify-between items-center">
                    {currentPhase === 'return' && !isAssessmentComplete && (
                        <Button
                            onClick={() => setCurrentPhase('pickup')}
                            variant="outline"
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Pickup
                        </Button>
                    )}
                    <div className="flex-1" />
                    {(allAnglesComplete || isAssessmentComplete) && (
                        <Button
                            onClick={handleActionButton}
                            disabled={isAnalyzing}
                            className="bg-gray-900 text-white hover:bg-gray-800 flex items-center gap-2"
                        >
                            {isAnalyzing ? (
                                <>
                                    <Loader className="h-4 w-4 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <ArrowRight className="h-4 w-4" />
                                    {getActionButtonLabel()}
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AssessmentPage;
