/**
 * ReportPage Component
 * Displays final damage report with comparison and cost estimates
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAssessment } from '../hooks/useAssessment';
import { VehicleAngle, Damage } from '../types';
import { ImageWithBoundingBoxes } from '../components/ImageWithBoundingBoxes';
import { Button } from '../components/ui/button';
import { ArrowLeft, Download, Share2, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';

const ANGLES: VehicleAngle[] = ['front', 'rear', 'driver_side', 'passenger_side', 'roof'];

export function ReportPage() {
    const { assessmentId } = useParams<{ assessmentId: string }>();
    const navigate = useNavigate();
    const { assessment, loading, error, fetchAssessment } = useAssessment();
    const [expandedAngle, setExpandedAngle] = useState<VehicleAngle | null>('front');

    useEffect(() => {
        if (assessmentId && !assessment) {
            fetchAssessment(assessmentId);
        }
    }, [assessmentId, assessment, fetchAssessment]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white p-8 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400 mb-4"></div>
                        <p className="text-gray-600">Loading report...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !assessment) {
        return (
            <div className="min-h-screen bg-white p-8 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-6">{error || 'Assessment not found'}</p>
                    <Button onClick={() => navigate('/')} variant="default">
                        Back to Assessments
                    </Button>
                </div>
            </div>
        );
    }

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'minor':
                return 'bg-slate-50 border-slate-200';
            case 'moderate':
                return 'bg-amber-50 border-amber-200';
            case 'severe':
                return 'bg-rose-50 border-rose-200';
            default:
                return 'bg-gray-50 border-gray-200';
        }
    };

    const getSeverityBadge = (severity: string) => {
        switch (severity) {
            case 'minor':
                return 'bg-slate-100 text-slate-700';
            case 'moderate':
                return 'bg-amber-100 text-amber-700';
            case 'severe':
                return 'bg-rose-100 text-rose-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const getAngleLabel = (angle: VehicleAngle): string => {
        const labels: Record<VehicleAngle, string> = {
            front: 'Front',
            rear: 'Rear',
            driver_side: 'Driver Side',
            passenger_side: 'Passenger Side',
            roof: 'Roof',
        };
        return labels[angle];
    };

    const DamageCard = ({ damage, isNew }: { damage: Damage; isNew?: boolean }) => (
        <div
            className={`p-4 border rounded-lg mb-3 ${getSeverityColor(
                damage.severity
            )} transition-all hover:shadow-md`}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getSeverityBadge(damage.severity)}`}>
                            {damage.severity.toUpperCase()}
                        </span>
                        {isNew && <span className="px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">NEW</span>}
                    </div>
                    <p className="font-medium text-gray-900 mb-1">{damage.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                        <div>Location: {damage.location}</div>
                        <div>Confidence: {(damage.aiConfidence * 100).toFixed(0)}%</div>
                    </div>
                </div>
                <div className="text-right ml-4">
                    <div className="text-2xl font-bold text-gray-900">${damage.estimatedCost}</div>
                    <div className="text-xs text-gray-600">Estimated</div>
                </div>
            </div>
        </div>
    );

    const AngleSection = ({ angle }: { angle: VehicleAngle }) => {
        const pickupDamages = assessment.pickupDamages?.[angle] || [];
        const returnDamages = assessment.returnDamages?.[angle] || [];
        const newDamages = assessment.newDamages?.[angle] || [];
        const hasNewDamages = newDamages.length > 0;

        return (
            <div className="mb-4 border rounded-lg overflow-hidden bg-white shadow-sm">
                <button
                    onClick={() => setExpandedAngle(expandedAngle === angle ? null : angle)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-xl">{getAngleLabel(angle)}</span>
                        <div className="flex gap-2">
                            {pickupDamages.length > 0 && (
                                <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">
                                    Pickup: {pickupDamages.length}
                                </span>
                            )}
                            {returnDamages.length > 0 && (
                                <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">
                                    Return: {returnDamages.length}
                                </span>
                            )}
                            {hasNewDamages && (
                                <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" /> New: {newDamages.length}
                                </span>
                            )}
                            {newDamages.length === 0 && returnDamages.length === 0 && (
                                <span className="px-2 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-semibold flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" /> No Changes
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="text-2xl text-gray-400">{expandedAngle === angle ? '−' : '+'}</div>
                </button>

                {expandedAngle === angle && (
                    <div className="p-4 border-t bg-gray-50">
                        {/* Before/After Images */}
                        <div className="mb-8">
                            <h4 className="font-bold text-gray-900 mb-4">Photos</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Pickup Photo */}
                                {assessment.pickupPhotos?.[angle] && (
                                    <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
                                        <div className="bg-slate-50 px-4 py-2 border-b border-gray-200">
                                            <p className="text-sm font-semibold text-slate-900">Pickup</p>
                                        </div>
                                        <ImageWithBoundingBoxes
                                            src={assessment.pickupPhotos[angle].storagePath || ''}
                                            alt={`Pickup - ${angle}`}
                                            damages={pickupDamages}
                                        />
                                    </div>
                                )}

                                {/* Return Photo */}
                                {assessment.returnPhotos?.[angle] && (
                                    <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
                                        <div className="bg-slate-50 px-4 py-2 border-b border-gray-200">
                                            <p className="text-sm font-semibold text-slate-900">Return</p>
                                        </div>
                                        <ImageWithBoundingBoxes
                                            src={assessment.returnPhotos[angle].storagePath || ''}
                                            alt={`Return - ${angle}`}
                                            damages={returnDamages}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {newDamages.length > 0 && (
                            <div className="mb-6">
                                <h4 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                                    New Damages ({newDamages.length})
                                </h4>
                                <div className="space-y-0">
                                    {newDamages.map((damage) => (
                                        <DamageCard key={damage.id} damage={damage} isNew={true} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {pickupDamages.length > 0 && (
                            <div className="mb-6">
                                <h4 className="font-bold text-slate-900 mb-3">Pickup Damages ({pickupDamages.length})</h4>
                                <div className="space-y-0">
                                    {pickupDamages.map((damage) => (
                                        <DamageCard key={damage.id} damage={damage} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {returnDamages.length > 0 && (
                            <div className="mb-6">
                                <h4 className="font-bold text-slate-900 mb-3">Return Damages ({returnDamages.length})</h4>
                                <div className="space-y-0">
                                    {returnDamages.map((damage) => (
                                        <DamageCard key={damage.id} damage={damage} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {newDamages.length === 0 && pickupDamages.length === 0 && returnDamages.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <CheckCircle2 className="h-12 w-12 text-teal-600 mx-auto mb-2" />
                                <p>No damages detected on this angle</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const costBreakdown = {
        pickup: Object.values(assessment.pickupDamages || {}).reduce(
            (sum, damages) => sum + (damages?.reduce((s, d) => s + d.estimatedCost, 0) || 0),
            0
        ),
        return: Object.values(assessment.returnDamages || {}).reduce(
            (sum, damages) => sum + (damages?.reduce((s, d) => s + d.estimatedCost, 0) || 0),
            0
        ),
        new: assessment.newDamageCost || 0,
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate('/')}
                                className="hover:bg-gray-100"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    {assessment.vehicleName}
                                </h1>
                                <p className="text-sm text-gray-600">Assessment Report • ID: {assessment.id}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.print()}
                                className="hover:bg-gray-50"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="hover:bg-gray-50"
                            >
                                <Share2 className="h-4 w-4 mr-2" />
                                Share
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    {/* Total Pickup Damages */}
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                        <div className="text-sm text-gray-600 font-semibold mb-1">Pickup Damages</div>
                        <div className="text-3xl font-bold text-slate-900">
                            {assessment.damageCounts?.pickup || 0}
                        </div>
                        <div className="text-xs text-gray-500 mt-2">${costBreakdown.pickup.toFixed(2)}</div>
                    </div>

                    {/* Total Return Damages */}
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                        <div className="text-sm text-gray-600 font-semibold mb-1">Return Damages</div>
                        <div className="text-3xl font-bold text-slate-900">
                            {assessment.damageCounts?.return || 0}
                        </div>
                        <div className="text-xs text-gray-500 mt-2">${costBreakdown.return.toFixed(2)}</div>
                    </div>

                    {/* New Damages */}
                    <div className={`bg-white rounded-lg p-6 shadow-sm border ${costBreakdown.new > 0 ? 'border-amber-200' : 'border-teal-200'}`}>
                        <div className="text-sm text-gray-600 font-semibold mb-1">New Damages</div>
                        <div className={`text-3xl font-bold ${costBreakdown.new > 0 ? 'text-amber-900' : 'text-teal-900'}`}>
                            {assessment.damageCounts?.new || 0}
                        </div>
                        <div className={`text-xs ${costBreakdown.new > 0 ? 'text-amber-600' : 'text-teal-600'} mt-2`}>
                            ${costBreakdown.new.toFixed(2)}
                        </div>
                    </div>

                    {/* Total Cost */}
                    <div className="bg-slate-800 rounded-lg p-6 shadow-sm text-white">
                        <div className="text-sm font-semibold mb-1 opacity-90">Total Damages</div>
                        <div className="text-3xl font-bold">
                            ${(costBreakdown.pickup + costBreakdown.return).toFixed(2)}
                        </div>
                        <div className="text-xs opacity-75 mt-2">Including pickup & return</div>
                    </div>
                </div>

                {/* Detailed Breakdown by Angle */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Damage Breakdown by Angle</h2>
                    <div className="space-y-2">
                        {ANGLES.map((angle) => (
                            <AngleSection key={angle} angle={angle} />
                        ))}
                    </div>
                </div>

                {/* No Damages Message */}
                {assessment.damageCounts?.new === 0 && (
                    <div className="bg-teal-50 border border-teal-200 rounded-lg p-8 text-center mb-8">
                        <CheckCircle2 className="h-16 w-16 text-teal-600 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-teal-900 mb-2">Perfect Condition!</h3>
                        <p className="text-teal-800">
                            No new damages detected between pickup and return. Vehicle is in excellent condition.
                        </p>
                    </div>
                )}

                {/* Summary Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                        <h3 className="font-semibold text-gray-900 mb-4">Severity Distribution</h3>
                        <div className="space-y-3">
                            {['minor', 'moderate', 'severe'].map((severity) => {
                                const count =
                                    Object.values(assessment.newDamages || {}).reduce(
                                        (sum, damages) =>
                                            sum + (damages?.filter((d) => d.severity === severity).length || 0),
                                        0
                                    ) || 0;
                                return (
                                    <div key={severity} className="flex items-center justify-between">
                                        <span className="text-gray-600 capitalize">{severity}</span>
                                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getSeverityBadge(severity)}`}>
                                            {count}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-white rounded-lg p-6 shadow-sm">
                        <h3 className="font-semibold text-gray-900 mb-4">Most Affected Angles</h3>
                        <div className="space-y-3">
                            {ANGLES.map((angle) => {
                                const newDamagesCount = assessment.newDamages?.[angle]?.length || 0;
                                if (newDamagesCount > 0) {
                                    return (
                                        <div key={angle} className="flex items-center justify-between">
                                            <span className="text-gray-600">{getAngleLabel(angle)}</span>
                                            <span className="px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-800">
                                                {newDamagesCount}
                                            </span>
                                        </div>
                                    );
                                }
                            })}
                            {Object.values(assessment.newDamages || {}).every((d) => !d || d.length === 0) && (
                                <p className="text-gray-500 text-sm">No new damages</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-lg p-6 shadow-sm">
                        <h3 className="font-semibold text-gray-900 mb-4">Timeline</h3>
                        <div className="space-y-3 text-sm text-gray-600">
                            <div>
                                <div className="font-semibold text-gray-900">Assessment Started</div>
                                <div>
                                    {new Date(assessment.timestamps.createdAt).toLocaleDateString()} at{' '}
                                    {new Date(assessment.timestamps.createdAt).toLocaleTimeString()}
                                </div>
                            </div>
                            {assessment.timestamps.completedAt && (
                                <div>
                                    <div className="font-semibold text-gray-900">Completed</div>
                                    <div>
                                        {new Date(assessment.timestamps.completedAt).toLocaleDateString()} at{' '}
                                        {new Date(assessment.timestamps.completedAt).toLocaleTimeString()}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="bg-white rounded-lg shadow-sm p-6 flex gap-4">
                    <Button onClick={() => navigate('/')} variant="outline" className="flex-1">
                        Back to Assessments
                    </Button>
                    <Button onClick={() => window.print()} variant="default" className="flex-1 bg-slate-800 hover:bg-slate-900">
                        Print Report
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default ReportPage;
