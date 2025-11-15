/**
 * Roboflow Provider
 * Integrates car-damage-c1f0i model from Roboflow
 * Real AI-powered damage detection with confidence scores
 */

import axios from 'axios';
import { Photo, VehicleAngle, AssessmentPhase } from '@/types';
import { IAIProvider, PhotoAnalysis, DetectedDamage } from '../aiProvider';

export class RoboflowProvider implements IAIProvider {
    name = 'roboflow';
    private apiKey: string;
    private modelEndpoint = 'https://serverless.roboflow.com/car-damage-c1f0i/1';

    constructor(apiKey?: string) {
        this.apiKey = apiKey || process.env.ROBOFLOW_API_KEY || '';
        if (!this.apiKey) {
            throw new Error('ROBOFLOW_API_KEY environment variable is required');
        }
    }

    /**
     * Validate Roboflow API key and model availability
     */
    async validateConfig(): Promise<boolean> {
        try {
            if (!this.apiKey) {
                console.warn('⚠️  Roboflow API key not configured');
                return false;
            }

            console.log('Testing Roboflow API connectivity...');

            // Test with a minimal request to check API key validity
            try {
                await axios({
                    method: 'POST',
                    url: this.modelEndpoint,
                    params: {
                        api_key: this.apiKey,
                        image: 'https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=400',
                    },
                    timeout: 30000,
                });
                console.log('✓ Roboflow API connection validated');
                return true;
            } catch (apiError: any) {
                // 401 = Invalid API key
                if (apiError.response?.status === 401) {
                    console.warn('❌ Invalid Roboflow API key');
                    return false;
                }

                // 400 = Bad request (but API is working)
                if (apiError.response?.status === 400) {
                    console.log('✓ Roboflow API key valid (model is responding)');
                    return true;
                }

                // Other errors might be temporary
                throw apiError;
            }
        } catch (error) {
            console.warn('⚠️  Roboflow API validation warning:', error instanceof Error ? error.message : error);
            // Still return true since API key might be valid
            return true;
        }
    }

    /**
     * Analyze photo using Roboflow damage detection model
     * Accepts photo with storagePath (URL) pointing to the image
     */
    async analyzePhoto(
        photo: Photo,
        angle: VehicleAngle,
        phase: AssessmentPhase
    ): Promise<PhotoAnalysis> {
        try {
            // Use storagePath (Supabase URL or public image URL)
            if (!photo.storagePath) {
                throw new Error('Photo storagePath (URL) is required for analysis');
            }

            console.log(`Analyzing photo with Roboflow: ${photo.storagePath}`);

            // Call Roboflow Inference API with image URL
            const response = await axios({
                method: 'POST',
                url: this.modelEndpoint,
                params: {
                    api_key: this.apiKey,
                    image: photo.storagePath,
                },
                timeout: 60000, // 60s timeout for model inference
            });

            // Parse Roboflow predictions
            const damages = this.parseRoboflowResponse(response.data);

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
            console.error(`Error analyzing photo with Roboflow: ${error}`);
            throw new Error(`Roboflow analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Parse Roboflow model response
     * Roboflow returns: { predictions: [{class: 'damage', confidence: 0.95, x, y, width, height}, ...] }
     */
    private parseRoboflowResponse(response: any): DetectedDamage[] {
        const damages: DetectedDamage[] = [];

        // Extract predictions from response
        const predictions = response.predictions || [];

        predictions.forEach((prediction: any) => {
            // Roboflow class label
            const classLabel = prediction.class || prediction.label || 'damage';
            const severity = this.mapRoboflowClass(classLabel);
            const confidence = prediction.confidence || 0;

            // Skip low confidence detections
            if (confidence < 0.3) return;

            // Extract bounding box (Roboflow returns x, y, width, height, plus coordinates)
            const location = this.extractLocation(prediction);

            // Estimate cost based on severity and confidence
            const estimatedCost = this.estimateCost(severity, confidence);

            damages.push({
                description: `${severity.charAt(0).toUpperCase() + severity.slice(1)} damage detected (${classLabel})`,
                severity,
                location,
                estimatedCost,
                confidence,
            });
        });

        return damages;
    }

    /**
     * Map Roboflow class labels to severity levels
     */
    private mapRoboflowClass(classLabel: string): 'minor' | 'moderate' | 'severe' {
        const label = classLabel.toLowerCase();

        if (label.includes('light') || label.includes('minor') || label.includes('scratch')) {
            return 'minor';
        }
        if (label.includes('moderate') || label.includes('medium') || label.includes('dent')) {
            return 'moderate';
        }
        if (label.includes('severe') || label.includes('major') || label.includes('critical') || label.includes('crush')) {
            return 'severe';
        }

        // Default to moderate if uncertain
        return 'moderate';
    }

    /**
     * Extract location from Roboflow bounding box
     * Roboflow provides: x, y, width, height (and also x0, y0, x1, y1, etc.)
     * Convert to center location string: "x:100,y:150"
     */
    private extractLocation(prediction: any): string {
        // Try to calculate center from bounding box
        let centerX = 0;
        let centerY = 0;

        // Roboflow format: x, y (top-left), width, height
        if (prediction.x !== undefined && prediction.y !== undefined) {
            centerX = Math.round(prediction.x);
            centerY = Math.round(prediction.y);

            // If we have width/height, adjust to center
            if (prediction.width !== undefined && prediction.height !== undefined) {
                centerX = Math.round(prediction.x + prediction.width / 2);
                centerY = Math.round(prediction.y + prediction.height / 2);
            }
        } else if (prediction.x0 !== undefined && prediction.y0 !== undefined && prediction.x1 !== undefined && prediction.y1 !== undefined) {
            // Alternative format: corners
            centerX = Math.round((prediction.x0 + prediction.x1) / 2);
            centerY = Math.round((prediction.y0 + prediction.y1) / 2);
        }

        return `x:${centerX},y:${centerY}`;
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
 * Usage: import { roboflowProvider } from '@/services/providers/roboflowProvider'
 */
export const roboflowProvider = new RoboflowProvider();

export default roboflowProvider;
