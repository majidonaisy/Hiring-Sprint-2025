/**
 * AI Service
 * Analyzes vehicle photos and detects damages
 * Uses the provider registry to route to configured AI provider (Roboflow, HuggingFace, etc.)
 */

import { Photo, VehicleAngle, AssessmentPhase } from '../types/index.js';
import { providerRegistry } from './aiProvider.js';
import { PhotoAnalysis } from './aiProvider.js';

/**
 * AI Service - routes analysis to active provider
 * Delegates to registered AI providers (Roboflow, HuggingFace, Mock, etc.)
 */
class AIService {
    /**
     * Analyze a photo using the active AI provider
     * Routes to Roboflow, HuggingFace, or other configured provider
     */
    async analyzePhoto(photo: Photo, angle: VehicleAngle, phase: AssessmentPhase): Promise<PhotoAnalysis> {
        try {
            const provider = providerRegistry.getActiveProvider();
            console.log(`Analyzing photo with provider: ${provider.name}`);

            // Delegate to active provider
            return await provider.analyzePhoto(photo, angle, phase);
        } catch (error) {
            console.error(`Error analyzing photo: ${error}`);
            throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

// Export singleton instance
export const aiService = new AIService();

// Export types for API responses
export type { PhotoAnalysis };

