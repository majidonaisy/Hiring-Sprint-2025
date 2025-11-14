/**
 * Utility Functions
 * Common helper functions used throughout the backend
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique ID
 */
export function generateId(): string {
    return uuidv4();
}

/**
 * Format date to ISO string
 */
export function formatDate(date: Date): string {
    return date.toISOString();
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`;
}

/**
 * Parse environment variable to number
 */
export function parseEnvNumber(value: string | undefined, defaultValue: number): number {
    if (!value) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Parse environment variable to boolean
 */
export function parseEnvBool(value: string | undefined, defaultValue: boolean): boolean {
    if (!value) return defaultValue;
    return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename: string): string {
    return filename
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 255);
}

/**
 * Get file extension
 */
export function getFileExtension(filename: string): string {
    return filename.substring(filename.lastIndexOf('.')).toLowerCase();
}

/**
 * Validate allowed file extensions
 */
export function isAllowedImageExtension(filename: string): boolean {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    return allowed.includes(getFileExtension(filename));
}

/**
 * Convert bytes to human readable format
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * Math.pow(10, dm)) / Math.pow(10, dm) + ' ' + sizes[i];
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(error: unknown): {
    message: string;
    code: string;
} {
    if (error instanceof Error) {
        return {
            message: error.message,
            code: 'INTERNAL_ERROR',
        };
    }
    return {
        message: 'An unknown error occurred',
        code: 'UNKNOWN_ERROR',
    };
}
