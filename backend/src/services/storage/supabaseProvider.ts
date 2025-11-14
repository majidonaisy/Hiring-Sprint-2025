/**
 * Supabase Storage Provider
 * Production-ready file storage using Supabase's S3-compatible storage
 * Features: CDN delivery, automatic image optimization, regional availability
 */

import axios from 'axios';
import { IStorageProvider, StorageUploadResponse, StorageDeleteResponse } from '../storage/storageProvider';

export class SupabaseProvider implements IStorageProvider {
    name = 'supabase';
    private projectUrl: string;
    private anonKey: string;
    private bucketName: string;
    private storageUrl: string;

    constructor(projectUrl?: string, anonKey?: string, bucketName?: string) {
        this.projectUrl = projectUrl || process.env.SUPABASE_PROJECT_URL || '';
        this.anonKey = anonKey || process.env.SUPABASE_ANON_KEY || '';
        this.bucketName = bucketName || process.env.SUPABASE_BUCKET_NAME || 'vehicle-inspection';
        this.storageUrl = `${this.projectUrl}/storage/v1/object`;

        if (!this.projectUrl || !this.anonKey) {
            console.warn('⚠️  Supabase credentials not fully configured');
        }
    }

    /**
     * Validate Supabase configuration
     */
    async validateConfig(): Promise<boolean> {
        try {
            if (!this.projectUrl || !this.anonKey) {
                console.warn('❌ Supabase credentials missing');
                return false;
            }

            // Test bucket access with a simple list request
            const response = await axios.get(`${this.storageUrl}/${this.bucketName}`, {
                headers: {
                    Authorization: `Bearer ${this.anonKey}`,
                    'X-Client-Info': 'supabase-js/2.0',
                },
                timeout: 5000,
            });

            if (response.status === 200) {
                console.log('✓ Supabase configuration validated');
                return true;
            }
        } catch (error: any) {
            // Bucket might exist but not be listable - that's OK
            // Only fail on auth errors (401) or missing project URL
            if (error.response?.status === 401) {
                console.warn('❌ Supabase authentication failed - invalid credentials');
                return false;
            }

            if (error.code === 'ECONNREFUSED' || error.message?.includes('ENOTFOUND')) {
                console.warn('❌ Cannot reach Supabase - check PROJECT_URL');
                return false;
            }

            // Other errors might be bucket-specific, continue
            console.log('✓ Supabase configuration validated (with bucket warnings)');
            return true;
        }

        return false;
    }

    /**
     * Upload file to Supabase storage
     */
    async upload(
        file: Buffer | string,
        filename: string,
        folder: string = 'vehicle-inspection'
    ): Promise<StorageUploadResponse> {
        try {
            // Convert file to buffer
            let fileBuffer: Buffer;
            if (typeof file === 'string') {
                fileBuffer = Buffer.from(file, 'utf-8');
            } else if (Buffer.isBuffer(file)) {
                fileBuffer = file;
            } else {
                throw new Error('Invalid file type');
            }

            // Create file path in bucket
            const filePath = `${folder}/${filename}`;

            // Upload to Supabase
            await axios.post(
                `${this.storageUrl}/${this.bucketName}/${filePath}`,
                fileBuffer,
                {
                    headers: {
                        Authorization: `Bearer ${this.anonKey}`,
                        'X-Client-Info': 'supabase-js/2.0',
                        'Content-Type': this.getMimeType(filename),
                    },
                    timeout: 30000,
                }
            );

            // Generate public URL
            const publicUrl = `${this.projectUrl}/storage/v1/object/public/${this.bucketName}/${filePath}`;

            return {
                url: publicUrl,
                publicId: filePath,
                filename,
                size: fileBuffer.length,
                mimeType: this.getMimeType(filename),
                metadata: {
                    supabasePath: filePath,
                    uploadedAt: new Date().toISOString(),
                    bucket: this.bucketName,
                },
            };
        } catch (error) {
            throw new Error(
                `Supabase upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Delete file from Supabase storage
     */
    async delete(publicId: string): Promise<StorageDeleteResponse> {
        try {
            const response = await axios.delete(
                `${this.storageUrl}/${this.bucketName}/${publicId}`,
                {
                    headers: {
                        Authorization: `Bearer ${this.anonKey}`,
                        'X-Client-Info': 'supabase-js/2.0',
                    },
                    timeout: 10000,
                }
            );

            return {
                success: response.status === 200,
                publicId,
            };
        } catch (error) {
            throw new Error(
                `Supabase delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Get file URL from public ID
     */
    getFileUrl(publicId: string): string {
        return `${this.projectUrl}/storage/v1/object/public/${this.bucketName}/${publicId}`;
    }

    /**
     * Get MIME type from filename
     */
    private getMimeType(filename: string): string {
        const ext = filename.toLowerCase().split('.').pop() || '';

        const mimeTypes: Record<string, string> = {
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            png: 'image/png',
            gif: 'image/gif',
            webp: 'image/webp',
            pdf: 'application/pdf',
            json: 'application/json',
            txt: 'text/plain',
        };

        return mimeTypes[ext] || 'application/octet-stream';
    }
}

/**
 * Export singleton instance
 */
export const supabaseProvider = new SupabaseProvider();

export default supabaseProvider;
