/**
 * Storage Provider Interface
 * Abstraction layer for different file storage backends
 * Supports: Cloudinary, S3, Firebase, local filesystem, etc.
 */

export interface StorageUploadResponse {
    url: string; // Public URL to access the file
    publicId: string; // Provider-specific ID
    filename: string;
    size: number;
    mimeType?: string;
    metadata?: Record<string, any>;
}

export interface StorageDeleteResponse {
    success: boolean;
    publicId: string;
}

/**
 * All storage providers must implement this interface
 */
export interface IStorageProvider {
    name: string;

    /**
     * Upload a file to storage
     * @param file - Buffer or file data
     * @param filename - Original filename
     * @param folder - Optional folder/path prefix
     */
    upload(
        file: Buffer | string,
        filename: string,
        folder?: string
    ): Promise<StorageUploadResponse>;

    /**
     * Delete a file from storage
     * @param publicId - Provider-specific file ID
     */
    delete(publicId: string): Promise<StorageDeleteResponse>;

    /**
     * Validate provider configuration
     */
    validateConfig(): Promise<boolean>;

    /**
     * Get file URL (useful if you have publicId but not full URL)
     */
    getFileUrl(publicId: string): string;
}

/**
 * Storage Provider Registry
 * Manages multiple storage providers and provider switching
 */
export class StorageProviderRegistry {
    private providers: Map<string, IStorageProvider> = new Map();
    private activeProvider: IStorageProvider | null = null;

    /**
     * Register a new storage provider
     */
    async registerProvider(name: string, provider: IStorageProvider): Promise<void> {
        this.providers.set(name, provider);
        console.log(`📦 Storage provider registered: ${name}`);
    }

    /**
     * Set the active storage provider
     */
    async setActiveProvider(providerName: string): Promise<void> {
        const provider = this.providers.get(providerName);
        if (!provider) {
            throw new Error(`Storage provider not found: ${providerName}`);
        }

        const isValid = await provider.validateConfig();
        if (!isValid) {
            throw new Error(`Storage provider configuration invalid: ${providerName}`);
        }

        this.activeProvider = provider;
        console.log(`✓ Active storage provider set to: ${providerName}`);
    }

    /**
     * Get the active storage provider
     */
    getActiveProvider(): IStorageProvider {
        if (!this.activeProvider) {
            throw new Error('No active storage provider configured');
        }
        return this.activeProvider;
    }

    /**
     * Get active provider name
     */
    getActiveProviderName(): string {
        if (!this.activeProvider) {
            return 'none';
        }
        return this.activeProvider.name;
    }

    /**
     * Upload a file using the active provider
     */
    async upload(
        file: Buffer | string,
        filename: string,
        folder?: string
    ): Promise<StorageUploadResponse> {
        const provider = this.getActiveProvider();
        return provider.upload(file, filename, folder);
    }

    /**
     * Delete a file using the active provider
     */
    async delete(publicId: string): Promise<StorageDeleteResponse> {
        const provider = this.getActiveProvider();
        return provider.delete(publicId);
    }

    /**
     * Get URL for a file
     */
    getFileUrl(publicId: string): string {
        const provider = this.getActiveProvider();
        return provider.getFileUrl(publicId);
    }

    /**
     * List all registered providers
     */
    listProviders(): string[] {
        return Array.from(this.providers.keys());
    }
}

/**
 * Export singleton instance
 */
export const storageRegistry = new StorageProviderRegistry();

export default storageRegistry;
