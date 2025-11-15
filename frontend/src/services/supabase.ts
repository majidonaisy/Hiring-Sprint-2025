/**
 * Supabase Storage Client
 * Handles direct uploads to Supabase Storage using Supabase JS client
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const BUCKET_NAME = import.meta.env.VITE_SUPABASE_BUCKET_NAME || 'car-images' as string;

interface UploadResponse {
    url: string;
    path: string;
    success: boolean;
}

class SupabaseStorageClient {
    private supabase;

    constructor() {
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            console.warn('⚠️  Supabase credentials not configured');
            throw new Error('Missing Supabase configuration');
        }

        this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }

    /**
     * Upload file to Supabase Storage
     * Returns public URL on success
     */
    async uploadFile(
        file: File,
        assessmentId: string,
        angle: string,
        phase: 'pickup' | 'return'
    ): Promise<UploadResponse> {
        try {
            // Generate unique file path
            const timestamp = Date.now();
            const filename = `${angle}_${phase}_${timestamp}_${file.name}`;
            const filePath = `assessments/${assessmentId}/${filename}`;

            console.log('📤 Uploading file to Supabase:', filePath);

            // Upload file using Supabase client
            const { data, error } = await this.supabase.storage
                .from(BUCKET_NAME)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (error) {
                throw error;
            }

            if (!data) {
                throw new Error('No data returned from upload');
            }

            // Get public URL
            const { data: publicUrlData } = this.supabase.storage
                .from(BUCKET_NAME)
                .getPublicUrl(filePath);

            const publicUrl = publicUrlData.publicUrl;

            console.log('✅ File uploaded successfully:', publicUrl);

            return {
                url: publicUrl,
                path: filePath,
                success: true,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('❌ Supabase upload failed:', errorMessage);
            throw new Error(`Supabase upload failed: ${errorMessage}`);
        }
    }

    /**
     * Delete file from Supabase Storage
     */
    async deleteFile(filePath: string): Promise<boolean> {
        try {
            const { error } = await this.supabase.storage
                .from(BUCKET_NAME)
                .remove([filePath]);

            if (error) {
                throw error;
            }

            console.log('✅ File deleted successfully:', filePath);
            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('❌ Failed to delete file:', errorMessage);
            return false;
        }
    }

    /**
     * Check if Supabase is configured
     */
    isConfigured(): boolean {
        return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
    }
}

export const supabaseStorage = new SupabaseStorageClient();
export default supabaseStorage;
