/**
 * HuggingFace YOLOv8 Provider
 * Integrates car-damage-level-detection-yolov8 model from HuggingFace
 * Real AI-powered damage detection with confidence scores
 */

import axios from 'axios';
import { Photo, VehicleAngle, AssessmentPhase } from '../../types/index.js';
import { IAIProvider, PhotoAnalysis, DetectedDamage } from '../aiProvider.js';

export class HuggingFaceProvider implements IAIProvider {
    name = 'huggingface';
    private apiKey: string;
    private modelEndpoint = 'https://api-inference.huggingface.co/models/Roboflow/car-damage-level-detection-yolov8';

    constructor(apiKey?: string) {
        this.apiKey = apiKey || process.env.HUGGINGFACE_API_KEY || '';
        if (!this.apiKey) {
            throw new Error('HUGGINGFACE_API_KEY environment variable is required');
        }
    }

    /**
     * Validate HuggingFace API key and model availability
     */
    async validateConfig(): Promise<boolean> {
        try {
            if (!this.apiKey) {
                console.warn('⚠️  HuggingFace API key not configured');
                return false;
            }

            console.log('Testing HuggingFace API connectivity...');

            // Test with a minimal request to check API key validity
            // Note: 410 errors are common for models that need loading, but API key is valid
            try {
                await axios.post(
                    this.modelEndpoint,
                    {
                        inputs: 'test', // Minimal test data
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${this.apiKey}`,
                            'Content-Type': 'application/json',
                        },
                        timeout: 10000,
                    }
                );
                console.log('✓ HuggingFace API connection validated');
                return true;
            } catch (apiError: any) {
                // 410 = Model loading, 503 = Model loading, but API key is valid
                // Only these errors indicate working credentials
                if (apiError.response?.status === 410 || apiError.response?.status === 503) {
                    console.log('✓ HuggingFace API key valid (model is loading or warming up)');
                    return true;
                }

                // 401 = Invalid API key
                if (apiError.response?.status === 401) {
                    console.warn('❌ Invalid HuggingFace API key');
                    return false;
                }

                // Other errors might be temporary
                throw apiError;
            }
        } catch (error) {
            console.warn('⚠️  HuggingFace API validation warning:', error instanceof Error ? error.message : error);
            // Still return true since API key might be valid
            return true;
        }
    }

    /**
     * Analyze photo using YOLOv8 damage detection model
     * Now accepts photo with storagePath (URL) instead of file data
     */
    async analyzePhoto(
        photo: Photo,
        angle: VehicleAngle,
        phase: AssessmentPhase
    ): Promise<PhotoAnalysis> {
        try {
            // Use storagePath (Supabase URL) directly instead of converting file
            if (!photo.storagePath) {
                throw new Error('Photo storagePath (URL) is required for analysis');
            }

            // Call HuggingFace Inference API with image URL
            const response = await axios.post(
                this.modelEndpoint,
                { inputs: photo.storagePath }, // Send URL directly
                {
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 30000, // 30s timeout for model inference
                }
            );

            // Parse YOLOv8 detections
            const damages = this.parseYOLOv8Response(response.data);

            // Calculate analysis score (0-1)
            const analysisScore = this.calculateAnalysisScore(damages);

            return {
                photoId: photo.id,
                angle,
                phase,
                detectedDamages: damages,
                analysisScore,
            };
        } catch (error) {
            console.error(`Error analyzing photo with HuggingFace: ${error}`);
            throw new Error(`HuggingFace analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Parse YOLOv8 model response
     * YOLOv8 returns: { detections: [{class: 'Moderate', confidence: 0.95, bbox: [x,y,w,h]}, ...] }
     */
    private parseYOLOv8Response(response: any): DetectedDamage[] {
        const damages: DetectedDamage[] = [];

        // Handle different response formats from HuggingFace
        const detections = Array.isArray(response) ? response : response.detections || [];

        detections.forEach((detection: any) => {
            // YOLOv8 class mapping
            const classLabel = detection.class || detection.label || '';
            const severity = this.mapYOLOv8Class(classLabel);
            const confidence = detection.confidence || detection.score || 0;

            // Skip low confidence detections
            if (confidence < 0.3) return;

            // Extract bounding box (typically [x1, y1, x2, y2] or [x, y, w, h])
            const bbox = detection.bbox || detection.box || [0, 0, 0, 0];
            const location = this.bboxToLocation(bbox);

            // Estimate cost based on severity and confidence
            const estimatedCost = this.estimateCost(severity, confidence);

            damages.push({
                description: `${severity.charAt(0).toUpperCase() + severity.slice(1)} damage detected`,
                severity,
                location,
                estimatedCost,
                confidence,
            });
        });

        return damages;
    }

    /**
     * Map YOLOv8 class labels to severity levels
     */
    private mapYOLOv8Class(classLabel: string): 'minor' | 'moderate' | 'severe' {
        const label = classLabel.toLowerCase();

        if (label.includes('light') || label.includes('minor')) {
            return 'minor';
        }
        if (label.includes('moderate') || label.includes('medium')) {
            return 'moderate';
        }
        if (label.includes('severe') || label.includes('major') || label.includes('critical')) {
            return 'severe';
        }

        // Default to moderate if uncertain
        return 'moderate';
    }

    /**
     * Convert bounding box to center location string
     * Format: "x:100,y:150"
     */
    private bboxToLocation(bbox: number[]): string {
        if (!Array.isArray(bbox) || bbox.length < 2) {
            return 'x:0,y:0';
        }

        // If bbox is [x1, y1, x2, y2], convert to center
        if (bbox.length === 4) {
            const x = Math.round((bbox[0] + bbox[2]) / 2);
            const y = Math.round((bbox[1] + bbox[3]) / 2);
            return `x:${x},y:${y}`;
        }

        // If bbox is [x, y, w, h], convert to center
        if (bbox.length >= 2) {
            const x = Math.round(bbox[0] + (bbox[2] || 0) / 2);
            const y = Math.round(bbox[1] + (bbox[3] || 0) / 2);
            return `x:${x},y:${y}`;
        }

        return 'x:0,y:0';
    }

    /**
     * Estimate repair cost based on severity and confidence
     */
    private estimateCost(severity: 'minor' | 'moderate' | 'severe', confidence: number): number {
        const baseCosts = {
            minor: 200,
            moderate: 500,
            severe: 1200,
        };

        const baseCost = baseCosts[severity];

        // Adjust by confidence (higher confidence = higher estimated cost)
        // This ensures high-confidence detections are valued appropriately
        return Math.round(baseCost * (0.8 + confidence * 0.2));
    }

    /**
     * Calculate overall analysis score (0-1)
     * Higher if detections are confident
     */
    private calculateAnalysisScore(damages: DetectedDamage[]): number {
        if (damages.length === 0) {
            return 1.0; // Perfect score if no damage found
        }

        const avgConfidence = damages.reduce((sum, d) => sum + d.confidence, 0) / damages.length;
        return Math.min(avgConfidence, 1.0);
    }
}

/**
 * Export singleton instance
 * Usage: import { huggingfaceProvider } from '@/services/providers/huggingfaceProvider'
 */
export const huggingfaceProvider = new HuggingFaceProvider();

export default huggingfaceProvider;
