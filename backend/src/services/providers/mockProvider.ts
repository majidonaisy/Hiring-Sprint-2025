/**
 * Mock AI Provider
 * Generates realistic test damages for development and testing
 * Implements IAIProvider interface
 */

import { Photo, VehicleAngle, AssessmentPhase } from '../../types/index.js';
import { IAIProvider, DetectedDamage, PhotoAnalysis } from '../aiProvider.js';

/**
 * Mock provider for testing and development
 * Generates consistent, realistic test data
 */
class MockProvider implements IAIProvider {
    name = 'mock';

    /**
     * Validate mock provider (always valid)
     */
    async validateConfig(): Promise<boolean> {
        return true;
    }

    /**
     * Analyze a photo and detect damages
     * Mock implementation generates realistic test damages
     */
    async analyzePhoto(photo: Photo, angle: VehicleAngle, phase: AssessmentPhase): Promise<PhotoAnalysis> {
        // Simulate API processing delay
        await new Promise((resolve) => setTimeout(resolve, 100));

        const detectedDamages: DetectedDamage[] = [];

        // Mock: Different damage patterns based on angle and phase
        if (phase === 'pickup') {
            // Pickup phase - baseline damages
            detectedDamages.push(...this.generatePickupDamages(angle));
        } else {
            // Return phase - includes new damages
            detectedDamages.push(...this.generateReturnDamages(angle));
        }

        const analysisScore = detectedDamages.length > 0 ? 0.85 : 0.95;

        return {
            photoId: photo.id,
            angle,
            phase,
            detectedDamages,
            analysisScore,
        };
    }

    /**
     * Generate mock damages for pickup phase
     */
    private generatePickupDamages(angle: VehicleAngle): DetectedDamage[] {
        const damages: DetectedDamage[] = [];

        // Simulate different baseline damages per angle
        switch (angle) {
            case 'front':
                damages.push({
                    description: 'Minor scratch on bumper',
                    severity: 'minor',
                    location: 'x:150,y:100',
                    estimatedCost: 150,
                    confidence: 0.92,
                    boundingBox: { x: 100, y: 50, width: 200, height: 100 },
                });
                break;

            case 'rear':
                damages.push({
                    description: 'Dent on rear panel',
                    severity: 'moderate',
                    location: 'x:200,y:80',
                    estimatedCost: 450,
                    confidence: 0.88,
                    boundingBox: { x: 150, y: 30, width: 250, height: 150 },
                });
                break;

            case 'driver_side':
                // No damage on driver side at pickup
                break;

            case 'passenger_side':
                damages.push({
                    description: 'Paint chip on door',
                    severity: 'minor',
                    location: 'x:100,y:120',
                    estimatedCost: 200,
                    confidence: 0.85,
                    boundingBox: { x: 50, y: 80, width: 150, height: 120 },
                });
                break;

            case 'roof':
                // No damage on roof at pickup
                break;
        }

        return damages;
    }

    /**
     * Generate mock damages for return phase
     * Includes new damages to simulate real-world scenario
     */
    private generateReturnDamages(angle: VehicleAngle): DetectedDamage[] {
        const damages: DetectedDamage[] = [];

        switch (angle) {
            case 'front':
                // Same scratch from pickup
                damages.push({
                    description: 'Minor scratch on bumper',
                    severity: 'minor',
                    location: 'x:150,y:100', // Same location
                    estimatedCost: 150,
                    confidence: 0.92,
                    boundingBox: { x: 100, y: 50, width: 200, height: 100 },
                });
                // NEW: Additional damage from usage
                damages.push({
                    description: 'New headlight crack',
                    severity: 'severe',
                    location: 'x:80,y:60',
                    estimatedCost: 800,
                    confidence: 0.9,
                    boundingBox: { x: 20, y: 20, width: 180, height: 100 },
                });
                break;

            case 'rear':
                // Same dent from pickup
                damages.push({
                    description: 'Dent on rear panel',
                    severity: 'moderate',
                    location: 'x:200,y:80', // Same location
                    estimatedCost: 450,
                    confidence: 0.88,
                    boundingBox: { x: 150, y: 30, width: 250, height: 150 },
                });
                break;

            case 'driver_side':
                // NEW: Damage on driver side that wasn't there before
                damages.push({
                    description: 'Deep scratch on door',
                    severity: 'severe',
                    location: 'x:120,y:140',
                    estimatedCost: 650,
                    confidence: 0.87,
                    boundingBox: { x: 70, y: 100, width: 200, height: 150 },
                });
                break;

            case 'passenger_side':
                // Same paint chip from pickup
                damages.push({
                    description: 'Paint chip on door',
                    severity: 'minor',
                    location: 'x:100,y:120', // Same location (±50px match)
                    estimatedCost: 200,
                    confidence: 0.85,
                    boundingBox: { x: 50, y: 80, width: 150, height: 120 },
                });
                break;

            case 'roof':
                // NEW: Hail damage on roof
                damages.push({
                    description: 'Hail damage - multiple dents',
                    severity: 'moderate',
                    location: 'x:200,y:150',
                    estimatedCost: 1200,
                    confidence: 0.89,
                    boundingBox: { x: 120, y: 80, width: 350, height: 280 },
                });
                break;
        }

        return damages;
    }
}

// Export singleton instance
export const mockProvider = new MockProvider();
