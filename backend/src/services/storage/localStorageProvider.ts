/**
 * Local Storage Provider (for development/testing)
 * Stores files in local filesystem and returns file:// URLs
 */

import * as fs from 'fs';
import * as path from 'path';
import { IStorageProvider, StorageUploadResponse, StorageDeleteResponse } from '../storage/storageProvider';

export class LocalStorageProvider implements IStorageProvider {
    name = 'local';
    private uploadDir: string;

    constructor(uploadDir?: string) {
        this.uploadDir = uploadDir || process.env.UPLOAD_DIR || './uploads';

        // Create upload directory if it doesn't exist
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    /**
     * Validate local storage configuration
     */
    async validateConfig(): Promise<boolean> {
        try {
            // Check if upload directory is writable
            const testFile = path.join(this.uploadDir, '.test');
            fs.writeFileSync(testFile, 'test');
            fs.unlinkSync(testFile);
            console.log('✓ Local storage configuration validated');
            return true;
        } catch (error) {
            console.warn('⚠️  Local storage validation failed:', error instanceof Error ? error.message : error);
            return false;
        }
    }

    /**
     * Upload file to local storage
     */
    async upload(
        file: Buffer | string,
        filename: string,
        folder: string = 'vehicle-inspection'
    ): Promise<StorageUploadResponse> {
        try {
            // Create folder if it doesn't exist
            const folderPath = path.join(this.uploadDir, folder);
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath, { recursive: true });
            }

            // Save file
            const filePath = path.join(folderPath, filename);
            const buffer = typeof file === 'string' ? Buffer.from(file, 'utf-8') : file;
            fs.writeFileSync(filePath, buffer);

            // Get file info
            const stats = fs.statSync(filePath);

            // Create public ID (relative path)
            const publicId = path.join(folder, filename).replace(/\\/g, '/');

            return {
                url: `file://${filePath}`,
                publicId,
                filename,
                size: stats.size,
                mimeType: 'image/jpeg',
                metadata: {
                    localPath: filePath,
                    savedAt: new Date().toISOString(),
                },
            };
        } catch (error) {
            throw new Error(`Local storage upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Delete file from local storage
     */
    async delete(publicId: string): Promise<StorageDeleteResponse> {
        try {
            const filePath = path.join(this.uploadDir, publicId);

            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                return { success: true, publicId };
            }

            return { success: false, publicId };
        } catch (error) {
            throw new Error(`Local storage delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get file URL from public ID
     */
    getFileUrl(publicId: string): string {
        const filePath = path.join(this.uploadDir, publicId);
        return `file://${filePath}`;
    }
}

/**
 * Export singleton instance
 */
export const localStorageProvider = new LocalStorageProvider();

export default localStorageProvider;
