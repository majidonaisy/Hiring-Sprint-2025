/**
 * API Client
 * Centralized HTTP client for all backend API calls
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3001/api';

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

class ApiClient {
    private client: AxiosInstance;

    constructor(baseURL: string = API_BASE_URL) {
        this.client = axios.create({
            baseURL,
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        });

        // Add response interceptor for error handling
        this.client.interceptors.response.use(
            (response) => response,
            (error: AxiosError) => {
                console.error('API Error:', error.response?.data || error.message);
                return Promise.reject(error);
            }
        );
    }

    /**
     * Generic GET request
     */
    async get<T = any>(url: string) {
        const response = await this.client.get<T>(url);
        return response.data;
    }

    /**
     * Generic POST request
     */
    async post<T = any>(url: string, data?: any) {
        const response = await this.client.post<T>(url, data);
        return response.data;
    }

    /**
     * Create a new assessment
     */
    async createAssessment(vehicleId: string, vehicleName: string) {
        const response = await this.client.post<ApiResponse<any>>('/assessments', {
            vehicleId,
            vehicleName,
        });
        return response.data;
    }

    /**
     * Get assessment details
     */
    async getAssessment(assessmentId: string) {
        const response = await this.client.get<ApiResponse<any>>(`/assessments/${assessmentId}`);
        return response.data;
    }

    /**
     * Get all assessments with pagination
     */
    async getAllAssessments(page: number = 1, limit: number = 10) {
        const response = await this.client.get<ApiResponse<any>>('/assessments', {
            params: { page, limit },
        });
        return response.data;
    }

    /**
     * Upload photo for an angle
     * Receives Supabase URL and stores in backend
     * Backend will use this URL to send to AI model
     */
    async uploadPhoto(
        assessmentId: string,
        angle: string,
        phase: 'pickup' | 'return',
        file: File,
        supabaseUrl: string
    ) {
        const response = await this.client.post<ApiResponse<any>>(
            `/assessments/${assessmentId}/photos/${angle}/${phase}`,
            {
                filename: file.name,
                storagePath: supabaseUrl, // Public URL from Supabase
                fileSize: file.size,
                url: supabaseUrl, // Also send as url for clarity
            }
        );
        return response.data;
    }

    /**
     * Delete photo for an angle
     */
    async deletePhoto(assessmentId: string, angle: string, phase: 'pickup' | 'return') {
        const response = await this.client.delete<ApiResponse<any>>(
            `/assessments/${assessmentId}/photos/${angle}/${phase}`
        );
        return response.data;
    }

    /**
     * Get phase status (which angles are complete)
     */
    async getPhaseStatus(assessmentId: string, phase: 'pickup' | 'return') {
        const response = await this.client.get<ApiResponse<any>>(
            `/assessments/${assessmentId}/phase-status/${phase}`
        );
        return response.data;
    }

    /**
     * Trigger pickup analysis
     */
    async analyzePickup(assessmentId: string) {
        const response = await this.client.post<ApiResponse<any>>(
            `/assessments/${assessmentId}/analyze/pickup`
        );
        return response.data;
    }

    /**
     * Trigger return analysis
     */
    async analyzeReturn(assessmentId: string) {
        const response = await this.client.post<ApiResponse<any>>(
            `/assessments/${assessmentId}/analyze/return`
        );
        return response.data;
    }

    /**
     * Compare pickup and return photos
     */
    async comparePhotos(assessmentId: string) {
        const response = await this.client.post<ApiResponse<any>>(
            `/assessments/${assessmentId}/compare`
        );
        return response.data;
    }

    /**
     * Get damage summary
     */
    async getDamageSummary(assessmentId: string) {
        const response = await this.client.get<ApiResponse<any>>(
            `/assessments/${assessmentId}/summary`
        );
        return response.data;
    }
}

export const apiClient = new ApiClient();
export default apiClient;
