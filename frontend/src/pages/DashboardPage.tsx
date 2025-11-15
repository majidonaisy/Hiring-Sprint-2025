/**
 * DashboardPage Component
 * Lists all assessments and allows users to view or create new ones
 * Clean, professional, minimalist design
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAssessments } from '../hooks/useAssessments';
import { Button } from '../components/ui/button';
import { Plus, ChevronRight, Calendar, Car, AlertCircle, Loader } from 'lucide-react';

export function DashboardPage() {
    const navigate = useNavigate();
    const { assessments, loading, error, fetchAssessments } = useAssessments();

    useEffect(() => {
        loadAssessments();
    }, []);

    const loadAssessments = async () => {
        try {
            await fetchAssessments(1, 10);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load assessments';
            toast.error(errorMessage);
        }
    };

    const handleViewAssessment = (assessmentId: string) => {
        navigate(`/assessment/${assessmentId}`);
    };

    const handleNewAssessment = () => {
        navigate('/assessment');
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pickup_in_progress':
                return 'bg-slate-50 border-slate-200';
            case 'pickup_complete':
                return 'bg-amber-50 border-amber-200';
            case 'return_in_progress':
                return 'bg-slate-50 border-slate-200';
            case 'completed':
                return 'bg-teal-50 border-teal-200';
            default:
                return 'bg-gray-50 border-gray-200';
        }
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            pickup_in_progress: 'Pickup In Progress',
            pickup_complete: 'Pickup Complete',
            return_in_progress: 'Return In Progress',
            completed: 'Completed',
        };
        return labels[status] || status;
    };

    const getStatusTextColor = (status: string) => {
        switch (status) {
            case 'pickup_in_progress':
                return 'text-slate-700';
            case 'pickup_complete':
                return 'text-amber-700';
            case 'return_in_progress':
                return 'text-slate-700';
            case 'completed':
                return 'text-teal-700';
            default:
                return 'text-gray-700';
        }
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-semibold text-gray-900">Assessments</h1>
                            <p className="mt-1 text-sm text-gray-600">
                                {assessments.length} {assessments.length === 1 ? 'assessment' : 'assessments'}
                            </p>
                        </div>
                        <Button
                            onClick={handleNewAssessment}
                            className="bg-gray-900 text-white hover:bg-gray-800 flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            New Assessment
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader className="h-6 w-6 text-gray-400 animate-spin" />
                    </div>
                ) : error ? (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-slate-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <h3 className="text-sm font-medium text-slate-900">Error loading assessments</h3>
                            <p className="text-sm text-slate-700 mt-1">{error}</p>
                        </div>
                    </div>
                ) : assessments.length === 0 ? (
                    <div className="text-center py-12">
                        <Car className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No assessments yet</h3>
                        <p className="text-gray-600 mb-6">Create your first vehicle assessment to get started</p>
                        <Button
                            onClick={handleNewAssessment}
                            className="bg-gray-900 text-white hover:bg-gray-800 mx-auto flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Create Assessment
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {assessments.map((assessment) => (
                            <button
                                key={assessment.id}
                                onClick={() => handleViewAssessment(assessment.id)}
                                className={`w-full text-left border rounded-lg p-4 transition-all hover:shadow-md hover:border-gray-300 ${getStatusColor(assessment.status)}`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-medium text-gray-900">
                                                {assessment.vehicleName}
                                            </h3>
                                            <span className={`text-xs font-semibold px-2 py-1 rounded bg-white ${getStatusTextColor(assessment.status)}`}>
                                                {getStatusLabel(assessment.status)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                {new Date(assessment.timestamps.createdAt).toLocaleDateString()}
                                            </div>
                                            <div>
                                                {assessment.damageCounts?.new ?? 0} new{' '}
                                                {assessment.damageCounts?.new === 1 ? 'damage' : 'damages'}
                                            </div>
                                            {assessment.newDamageCost > 0 && (
                                                <div className="font-medium text-gray-900">
                                                    ${assessment.newDamageCost.toFixed(2)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-gray-400 ml-4 flex-shrink-0" />
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default DashboardPage;
