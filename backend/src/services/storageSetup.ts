/**
 * Storage Provider Setup
 * Initialize and configure storage providers on server startup
 */

import { StorageProviderRegistry } from './storage/storageProvider.js';
import { cloudinaryProvider } from './storage/cloudinaryProvider.js';
import { localStorageProvider } from './storage/localStorageProvider.js';
import { supabaseProvider } from './storage/supabaseProvider.js';

/**
 * Global storage registry instance
 */
export let storageRegistry: StorageProviderRegistry;

/**
 * Initialize storage providers
 */
export async function initializeStorageProviders(): Promise<void> {
    console.log('🔧 Initializing storage providers...');

    storageRegistry = new StorageProviderRegistry();

    // Register Local storage provider (always available as fallback)
    try {
        await storageRegistry.registerProvider('local', localStorageProvider);
        console.log('✓ Local storage provider registered');
    } catch (error) {
        console.error('❌ Failed to register local storage provider:', error instanceof Error ? error.message : error);
    }

    // Register Cloudinary provider (if credentials available)
    try {
        await storageRegistry.registerProvider('cloudinary', cloudinaryProvider);

        // Validate Cloudinary config
        const isValid = await cloudinaryProvider.validateConfig();
        if (isValid) {
            console.log('✓ Cloudinary provider registered and validated');
        } else {
            console.warn('⚠️  Cloudinary registered but needs credentials (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)');
        }
    } catch (error) {
        console.error('❌ Failed to register Cloudinary provider:', error instanceof Error ? error.message : error);
    }

    // Register Supabase provider (if credentials available)
    try {
        await storageRegistry.registerProvider('supabase', supabaseProvider);

        // Validate Supabase config
        const isValid = await supabaseProvider.validateConfig();
        if (isValid) {
            console.log('✓ Supabase provider registered and validated');
        } else {
            console.warn('⚠️  Supabase registered but needs credentials (SUPABASE_PROJECT_URL, SUPABASE_ANON_KEY, SUPABASE_BUCKET_NAME)');
        }
    } catch (error) {
        console.error('❌ Failed to register Supabase provider:', error instanceof Error ? error.message : error);
    }

    // Get active provider from environment, default to 'local' if not specified
    let activeProvider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();

    // If requested provider not available, use local
    const availableProviders = storageRegistry.listProviders();
    if (!availableProviders.includes(activeProvider)) {
        console.warn(`⚠️  Requested provider '${activeProvider}' not available, falling back to 'local'`);
        activeProvider = 'local';
    }

    try {
        await storageRegistry.setActiveProvider(activeProvider);
        console.log(`🎯 Active storage provider: ${activeProvider}`);
    } catch (error) {
        console.error(
            `❌ Failed to set active provider: ${error instanceof Error ? error.message : error}`
        );
        // Fallback to local if anything fails
        try {
            await storageRegistry.setActiveProvider('local');
            console.log('🎯 Fallback to local storage provider');
        } catch (fallbackError) {
            throw new Error(`Unable to initialize any storage provider: ${fallbackError}`);
        }
    }

    // Log available providers
    const providers = storageRegistry.listProviders();
    console.log(`📦 Available storage providers: ${providers.join(', ')}`);
}

/**
 * Get storage provider info
 */
export function getStorageProviderInfo(): { active: string; available: string[] } {
    if (!storageRegistry) {
        throw new Error('Storage providers not initialized');
    }

    return {
        active: storageRegistry.getActiveProviderName(),
        available: storageRegistry.listProviders(),
    };
}

/**
 * Switch active storage provider at runtime
 */
export async function switchStorageProvider(providerName: string): Promise<void> {
    if (!storageRegistry) {
        throw new Error('Storage providers not initialized');
    }

    await storageRegistry.setActiveProvider(providerName);
    console.log(`🎯 Switched active storage provider to: ${providerName}`);
}
