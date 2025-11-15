/**
 * AssessmentCreationModal Component
 * Dialog for creating a new assessment
 */

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/button';

interface AssessmentCreationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (vehicleId: string, vehicleName: string) => void;
    isLoading?: boolean;
}

export function AssessmentCreationModal({
    isOpen,
    onClose,
    onCreate,
    isLoading = false,
}: AssessmentCreationModalProps) {
    const [vehicleId, setVehicleId] = useState('');
    const [vehicleName, setVehicleName] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!vehicleId.trim()) {
            setError('Vehicle ID is required');
            return;
        }

        if (!vehicleName.trim()) {
            setError('Vehicle Name is required');
            return;
        }

        onCreate(vehicleId.trim(), vehicleName.trim());
        setVehicleId('');
        setVehicleName('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">New Assessment</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
                        disabled={isLoading}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Vehicle ID */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Vehicle ID
                        </label>
                        <input
                            type="text"
                            value={vehicleId}
                            onChange={(e) => setVehicleId(e.target.value)}
                            placeholder="e.g., CAR-001, ABC123"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                            disabled={isLoading}
                        />
                    </div>

                    {/* Vehicle Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Vehicle Name
                        </label>
                        <input
                            type="text"
                            value={vehicleName}
                            onChange={(e) => setVehicleName(e.target.value)}
                            placeholder="e.g., Toyota Camry 2020"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                            disabled={isLoading}
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            onClick={onClose}
                            variant="outline"
                            className="flex-1"
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Creating...' : 'Create'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
