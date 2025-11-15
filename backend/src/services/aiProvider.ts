/**
 * AI Provider Interface
 * Abstraction layer for swapping between different AI providers
 * Supports: Mock (current), Hugging Face, Roboflow, custom providers
 */

import { Photo, VehicleAngle, AssessmentPhase } from '@/types';

export interface DetectedDamage {
    description: string;
    severity: 'minor' | 'moderate' | 'severe';
    location: string; // Format: "x:100,y:150"
    estimatedCost: number;
    confidence: number;
    boundingBox?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

export interface PhotoAnalysis {
    photoId: string;
    angle: VehicleAngle;
    phase: AssessmentPhase;
    detectedDamages: DetectedDamage[];
    analysisScore: number;
}

/**
 * Base provider interface - all AI providers must implement this
 */
export interface IAIProvider {
    name: string;
    analyzePhoto(photo: Photo, angle: VehicleAngle, phase: AssessmentPhase): Promise<PhotoAnalysis>;
    validateConfig(): Promise<boolean>;
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
    provider: 'mock' | 'huggingface' | 'roboflow' | 'custom';
    apiKey?: string;
    modelId?: string;
    endpoint?: string;
    customHeadersmit?: Record<string, string>;
}

/**
 * AI Provider Registry - manages provider instances and selection
 */
export class AIProviderRegistry {
    private providers: Map<string, IAIProvider> = new Map();
    private activeProvider: IAIProvider | null = null;

    /**
     * Register a new AI provider
     */
    registerProvider(name: string, provider: IAIProvider): void {
        this.providers.set(name, provider);
    }

    /**
     * Set active provider
     */
    async setActiveProvider(providerName: string): Promise<void> {
        const provider = this.providers.get(providerName);
        if (!provider) {
            throw new Error(`Provider not found: ${providerName}`);
        }

        const isValid = await provider.validateConfig();
        if (!isValid) {
            throw new Error(`Provider configuration invalid: ${providerName}`);
        }

        this.activeProvider = provider;
    }

    /**
     * Get active provider
     */
    getActiveProvider(): IAIProvider {
        if (!this.activeProvider) {
            throw new Error('No active AI provider configured');
        }
        return this.activeProvider;
    }

    /**
     * Analyze photo with active provider
     */
    async analyzePhoto(
        photo: Photo,
        angle: VehicleAngle,
        phase: AssessmentPhase
    ): Promise<PhotoAnalysis> {
        const provider = this.getActiveProvider();
        return provider.analyzePhoto(photo, angle, phase);
    }

    /**
     * List all registered providers
     */
    listProviders(): string[] {
        return Array.from(this.providers.keys());
    }
}

// Export singleton registry
export const providerRegistry = new AIProviderRegistry();
