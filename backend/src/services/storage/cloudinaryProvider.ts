/**
 * Cloudinary Storage Provider
 * Production-ready file storage with image optimization
 * Supports immediate deletion and URL-based access
 */

import axios from 'axios';
import FormData from 'form-data';
import { IStorageProvider, StorageUploadResponse, StorageDeleteResponse } from '../storage/storageProvider';

export class CloudinaryProvider implements IStorageProvider {
    name = 'cloudinary';
    private cloudName: string;
    private apiKey: string;
    private apiSecret: string;
    private uploadUrl: string;

    constructor(
        cloudName?: string,
        apiKey?: string,
        apiSecret?: string
    ) {
        this.cloudName = cloudName || process.env.CLOUDINARY_CLOUD_NAME || '';
        this.apiKey = apiKey || process.env.CLOUDINARY_API_KEY || '';
        this.apiSecret = apiSecret || process.env.CLOUDINARY_API_SECRET || '';
        this.uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;

        if (!this.cloudName || !this.apiKey || !this.apiSecret) {
            console.warn('⚠️  Cloudinary credentials not fully configured');
        }
    }

    /**
     * Validate Cloudinary configuration
     */
    async validateConfig(): Promise<boolean> {
        try {
            if (!this.cloudName || !this.apiKey || !this.apiSecret) {
                console.warn('❌ Cloudinary credentials missing');
                return false;
            }

            // Test with a simple API call
            const response = await axios.get(
                `https://api.cloudinary.com/v1_1/${this.cloudName}/resource_types`,
                {
                    auth: {
                        username: this.apiKey,
                        password: this.apiSecret,
                    },
                    timeout: 5000,
                }
            );

            if (response.status === 200) {
                console.log('✓ Cloudinary configuration validated');
                return true;
            }
        } catch (error) {
            console.warn('⚠️  Cloudinary validation failed:', error instanceof Error ? error.message : error);
        }

        return false;
    }

    /**
     * Upload file to Cloudinary
     */
    async upload(
        file: Buffer | string,
        filename: string,
        folder: string = 'vehicle-inspection'
    ): Promise<StorageUploadResponse> {
        try {
            const form = new FormData();

            // Add file
            if (typeof file === 'string') {
                // If it's a URL or base64
                form.append('file', file);
            } else if (Buffer.isBuffer(file)) {
                // If it's a buffer
                form.append('file', file, filename);
            } else {
                throw new Error('Invalid file type');
            }

            // Add folder
            form.append('folder', folder);

            // Add public ID (folder/filename)
            const publicId = `${folder}/${filename.replace(/\.[^/.]+$/, '')}`; // Remove extension
            form.append('public_id', publicId);

            // Add API credentials
            form.append('api_key', this.apiKey);

            // Timestamp for API
            const timestamp = Math.floor(Date.now() / 1000);
            form.append('timestamp', timestamp.toString());

            // Create signature (required for authenticated uploads)
            const signature = this.generateSignature(
                { public_id: publicId, timestamp },
                this.apiSecret
            );
            form.append('signature', signature);

            // Add metadata
            form.append('context', `filename=${filename}`);

            // Upload to Cloudinary
            const response = await axios.post(this.uploadUrl, form, {
                headers: form.getHeaders(),
                timeout: 30000,
            });

            const data = response.data;

            return {
                url: data.secure_url || data.url,
                publicId: data.public_id,
                filename: data.original_filename || filename,
                size: data.bytes || 0,
                mimeType: data.resource_type,
                metadata: {
                    cloudinaryId: data.public_id,
                    version: data.version,
                    format: data.format,
                    width: data.width,
                    height: data.height,
                },
            };
        } catch (error) {
            throw new Error(
                `Cloudinary upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Delete file from Cloudinary
     */
    async delete(publicId: string): Promise<StorageDeleteResponse> {
        try {
            const timestamp = Math.floor(Date.now() / 1000);

            const signature = this.generateSignature(
                { public_id: publicId, timestamp },
                this.apiSecret
            );

            const response = await axios.post(
                `https://api.cloudinary.com/v1_1/${this.cloudName}/image/destroy`,
                {
                    public_id: publicId,
                    api_key: this.apiKey,
                    timestamp,
                    signature,
                },
                { timeout: 10000 }
            );

            return {
                success: response.data.result === 'ok',
                publicId,
            };
        } catch (error) {
            throw new Error(
                `Cloudinary delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Get file URL from public ID
     */
    getFileUrl(publicId: string): string {
        return `https://res.cloudinary.com/${this.cloudName}/image/upload/${publicId}`;
    }

    /**
     * Generate Cloudinary API signature
     * Required for authenticated API calls
     */
    private generateSignature(
        params: Record<string, any>,
        secret: string
    ): string {
        const crypto = require('crypto');

        // Sort parameters and create query string
        const sortedParams = Object.keys(params)
            .sort()
            .map((key) => `${key}=${params[key]}`)
            .join('&');

        // Create SHA-1 hash
        return crypto.createHash('sha1').update(sortedParams + secret).digest('hex');
    }
}

/**
 * Export singleton instance
 */
export const cloudinaryProvider = new CloudinaryProvider();

export default cloudinaryProvider;
