/**
 * PhotoUploader Component
 * Handles file upload for a specific angle
 */

import { useRef, useState } from 'react';
import { Upload, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { VehicleAngle } from '../types';
import { Button } from './ui/button';

interface PhotoUploaderProps {
    angle: VehicleAngle;
    onUpload: (file: File) => void;
    isLoading?: boolean;
    isComplete?: boolean;
    uploadError?: string | null;
}

export function PhotoUploader({
    angle,
    onUpload,
    isLoading = false,
    isComplete = false,
    uploadError = null,
}: PhotoUploaderProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>('');

    const angleLabels: Record<VehicleAngle, string> = {
        front: '🔵 Front',
        rear: '🔴 Rear',
        driver_side: '🟡 Driver Side',
        passenger_side: '🟢 Passenger Side',
        roof: '⬜ Roof',
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('File size must be less than 10MB');
            return;
        }

        setFileName(file.name);

        // Create preview
        const reader = new FileReader();
        reader.onload = (event) => {
            setPreview(event.target?.result as string);
        };
        reader.readAsDataURL(file);

        // Trigger upload
        onUpload(file);
    };

    const handleClear = () => {
        setPreview(null);
        setFileName('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors bg-white">
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">{angleLabels[angle]}</h3>
                    {isComplete && (
                        <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle2 size={20} />
                        </div>
                    )}
                    {uploadError && (
                        <div className="flex items-center gap-2 text-red-600">
                            <AlertCircle size={20} />
                        </div>
                    )}
                </div>

                {/* Preview or Upload Area */}
                {preview ? (
                    <div className="relative">
                        <img
                            src={preview}
                            alt={`Preview for ${angleLabels[angle]}`}
                            className="w-full h-48 object-cover rounded-md"
                        />
                        {!isLoading && !isComplete && (
                            <Button
                                variant="destructive"
                                size="icon"
                                onClick={handleClear}
                                className="absolute top-2 right-2 rounded-full"
                                title="Remove image"
                            >
                                <X size={20} />
                            </Button>
                        )}
                        {isLoading && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-md flex items-center justify-center">
                                <div className="animate-spin">
                                    <div className="h-8 w-8 border-4 border-white border-t-transparent rounded-full" />
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="cursor-pointer text-center py-8 border border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                    >
                        <Upload className="mx-auto mb-3 text-gray-400" size={32} />
                        <p className="text-gray-700 font-medium mb-1">Click to upload</p>
                        <p className="text-gray-500 text-sm">or drag and drop</p>
                        <p className="text-gray-400 text-xs mt-2">JPG, PNG • Max 10MB</p>
                    </div>
                )}

                {/* File Info */}
                {fileName && (
                    <p className="text-sm text-gray-600 truncate">
                        <span className="font-medium">File:</span> {fileName}
                    </p>
                )}

                {/* Error Message */}
                {uploadError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 flex items-start gap-2">
                        <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                        <span>{uploadError}</span>
                    </div>
                )}

                {/* Hidden File Input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isLoading}
                />
            </div>
        </div>
    );
}
