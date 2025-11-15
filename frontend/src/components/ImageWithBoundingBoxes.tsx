/**
 * ImageWithBoundingBoxes Component
 * Displays an image with damage bounding boxes drawn on top
 */

import { useState, useRef, useEffect } from 'react';
import { Damage } from '../types';

interface ImageWithBoundingBoxesProps {
    src: string;
    alt: string;
    damages: Damage[];
}

export function ImageWithBoundingBoxes({ src, alt, damages }: ImageWithBoundingBoxesProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const [isImageLoaded, setIsImageLoaded] = useState(false);

    // Draw bounding boxes on canvas when image loads
    useEffect(() => {
        if (!isImageLoaded || !imageRef.current || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = imageRef.current;

        // Set canvas size to match image
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        // Draw the image on canvas
        ctx.drawImage(img, 0, 0);

        // Draw bounding boxes for damages
        damages.forEach((damage) => {
            if (!damage.boundingBox) return;

            const { x, y, width, height } = damage.boundingBox;

            // Color based on severity
            let color = '#FFD700'; // yellow for minor
            let strokeWidth = 3;

            switch (damage.severity) {
                case 'minor':
                    color = '#FFD700'; // yellow
                    break;
                case 'moderate':
                    color = '#FF8C00'; // orange
                    break;
                case 'severe':
                    color = '#FF0000'; // red
                    break;
            }

            // Draw rectangle
            ctx.strokeStyle = color;
            ctx.lineWidth = strokeWidth;
            ctx.strokeRect(x, y, width, height);

            // Draw label background
            const label = `${damage.severity.toUpperCase()}: ${(damage.aiConfidence * 100).toFixed(0)}%`;
            ctx.font = 'bold 14px Arial';
            const textMetrics = ctx.measureText(label);
            const textHeight = 20;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(x, y - textHeight - 4, textMetrics.width + 8, textHeight);

            // Draw label text
            ctx.fillStyle = color;
            ctx.fillText(label, x + 4, y - 6);
        });
    }, [isImageLoaded, damages]);

    const handleImageLoad = () => {
        setIsImageLoaded(true);
    };

    return (
        <div className="relative w-full bg-gray-900 rounded-lg overflow-hidden">
            {/* Hidden image element for reference */}
            <img
                ref={imageRef}
                src={src}
                alt={alt}
                className="hidden"
                onLoad={handleImageLoad}
            />

            {/* Canvas with bounding boxes */}
            <canvas
                ref={canvasRef}
                className="w-full h-auto block"
                style={{ display: isImageLoaded ? 'block' : 'none' }}
            />

            {/* Loading state or fallback */}
            {!isImageLoaded && (
                <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                    <div className="text-gray-400">Loading image...</div>
                </div>
            )}
        </div>
    );
}

export default ImageWithBoundingBoxes;
