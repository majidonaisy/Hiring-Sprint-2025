/**
 * AI Provider Setup & Configuration
 * Initializes and registers available AI providers
 * Selects active provider based on environment configuration
 */

import { providerRegistry } from './aiProvider.js';
import { mockProvider } from './providers/mockProvider.js';
import { huggingfaceProvider } from './providers/huggingfaceProvider.js';
import { roboflowProvider } from './providers/roboflowProvider.js';

/**
 * Initialize all available AI providers
 */
export async function initializeAIProviders(): Promise<void> {
    console.log('\n📦 Initializing AI Providers...\n');

    try {
        // Register Mock Provider (always available)
        await providerRegistry.registerProvider('mock', mockProvider);
        console.log('✓ Mock provider registered (for testing/development)');

        // Register HuggingFace Provider
        try {
            const isValid = await huggingfaceProvider.validateConfig();
            if (isValid) {
                await providerRegistry.registerProvider('huggingface', huggingfaceProvider);
                console.log('✓ HuggingFace provider registered (car-damage-level-detection-yolov8)');
            } else {
                console.log('⚠️  HuggingFace provider skipped (API key not configured)');
            }
        } catch (error) {
            console.log('⚠️  HuggingFace provider failed to initialize:', error instanceof Error ? error.message : error);
        }

        // Register Roboflow Provider
        try {
            const isValid = await roboflowProvider.validateConfig();
            if (isValid) {
                await providerRegistry.registerProvider('roboflow', roboflowProvider);
                console.log('✓ Roboflow provider registered (car-damage-c1f0i)');
            } else {
                console.log('⚠️  Roboflow provider skipped (API key not configured)');
            }
        } catch (error) {
            console.log('⚠️  Roboflow provider failed to initialize:', error instanceof Error ? error.message : error);
        }

        // Set active provider
        const activeProvider = process.env.AI_PROVIDER || 'mock';
        console.log(`\n🎯 Setting active provider: ${activeProvider.toUpperCase()}`);

        try {
            await providerRegistry.setActiveProvider(activeProvider);
            console.log(`✓ Active provider set to: ${activeProvider}\n`);
        } catch (error) {
            console.warn(
                `⚠️  Failed to set provider to ${activeProvider}, falling back to mock:`,
                error instanceof Error ? error.message : error
            );
            await providerRegistry.setActiveProvider('mock');
            console.log('✓ Fallback to mock provider\n');
        }
    } catch (error) {
        console.error('❌ Failed to initialize AI providers:', error);
        throw error;
    }
}

/**
 * Get information about configured providers
 */
export function getProviderInfo(): {
    availableProviders: string[];
    activeProvider: string;
} {
    const providers = providerRegistry.listProviders();
    const activeProvider = process.env.AI_PROVIDER || 'mock';

    return {
        availableProviders: providers,
        activeProvider,
    };
}

/**
 * Switch active provider at runtime
 * Usage: await switchAIProvider('huggingface')
 */
export async function switchAIProvider(providerName: string): Promise<void> {
    console.log(`\n🔄 Switching to provider: ${providerName}`);
    try {
        await providerRegistry.setActiveProvider(providerName);
        console.log(`✓ Active provider switched to: ${providerName}\n`);
    } catch (error) {
        throw new Error(`Failed to switch provider: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export default initializeAIProviders;
