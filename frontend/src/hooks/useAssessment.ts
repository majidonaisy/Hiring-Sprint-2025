/**
 * useAssessment Hook
 * Manages assessment state and API calls
 * Handles photo upload to Supabase first, then backend
 */

import { useState, useCallback } from 'react';
import apiClient from '../services/api';
import supabaseStorage from '../services/supabase';
import { Assessment, AssessmentPhase, VehicleAngle } from '../types';

interface UseAssessmentReturn {
    assessment: Assessment | null;
    loading: boolean;
    error: string | null;
    createAssessment: (vehicleId: string, vehicleName: string) => Promise<Assessment>;
    fetchAssessment: (assessmentId: string) => Promise<Assessment>;
    uploadPhoto: (
        assessmentId: string,
        angle: VehicleAngle,
        phase: AssessmentPhase,
        file: File
    ) => Promise<any>;
    deletePhoto: (
        assessmentId: string,
        angle: VehicleAngle,
        phase: AssessmentPhase
    ) => Promise<any>;
    getPhaseStatus: (assessmentId: string, phase: AssessmentPhase) => Promise<any>;
    analyzePickup: (assessmentId: string) => Promise<any>;
    analyzeReturn: (assessmentId: string) => Promise<any>;
    comparePhotos: (assessmentId: string) => Promise<any>;
    getDamageSummary: (assessmentId: string) => Promise<any>;
}

export function useAssessment(): UseAssessmentReturn {
    const [assessment, setAssessment] = useState<Assessment | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleError = useCallback((err: any) => {
        const errorMessage = err?.response?.data?.error || err?.message || 'An error occurred';
        setError(errorMessage);
        console.error('Assessment Error:', errorMessage);
    }, []);

    const createAssessment = useCallback(
        async (vehicleId: string, vehicleName: string): Promise<Assessment> => {
            setLoading(true);
            setError(null);
            try {
                const response = await apiClient.createAssessment(vehicleId, vehicleName);
                setAssessment(response.data);
                return response.data;
            } catch (err) {
                handleError(err);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [handleError]
    );

    const fetchAssessment = useCallback(
        async (assessmentId: string): Promise<Assessment> => {
            setLoading(true);
            setError(null);
            try {
                const response = await apiClient.getAssessment(assessmentId);
                setAssessment(response.data);
                return response.data;
            } catch (err) {
                handleError(err);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [handleError]
    );

    const uploadPhoto = useCallback(
        async (
            assessmentId: string,
            angle: VehicleAngle,
            phase: AssessmentPhase,
            file: File
        ) => {
            setLoading(true);
            setError(null);
            try {
                // Step 1: Upload to Supabase Storage
                if (!supabaseStorage.isConfigured()) {
                    throw new Error('Supabase is not configured');
                }

                const uploadResult = await supabaseStorage.uploadFile(file, assessmentId, angle, phase);

                // Step 2: Send URL to backend
                const response = await apiClient.uploadPhoto(
                    assessmentId,
                    angle,
                    phase,
                    file,
                    uploadResult.url
                );

                // Step 3: Refresh assessment after successful upload
                await fetchAssessment(assessmentId);
                return response.data;
            } catch (err) {
                handleError(err);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [handleError, fetchAssessment]
    );

    const deletePhoto = useCallback(
        async (assessmentId: string, angle: VehicleAngle, phase: AssessmentPhase) => {
            setLoading(true);
            setError(null);
            try {
                const response = await apiClient.deletePhoto(assessmentId, angle, phase);
                // Refresh assessment after deletion
                await fetchAssessment(assessmentId);
                return response.data;
            } catch (err) {
                handleError(err);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [handleError, fetchAssessment]
    );

    const getPhaseStatus = useCallback(
        async (assessmentId: string, phase: AssessmentPhase) => {
            setLoading(true);
            setError(null);
            try {
                const response = await apiClient.getPhaseStatus(assessmentId, phase);
                return response.data;
            } catch (err) {
                handleError(err);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [handleError]
    );

    const analyzePickup = useCallback(
        async (assessmentId: string) => {
            setLoading(true);
            setError(null);
            try {
                const response = await apiClient.analyzePickup(assessmentId);
                // Refresh assessment after analysis
                await fetchAssessment(assessmentId);
                return response.data;
            } catch (err) {
                handleError(err);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [handleError, fetchAssessment]
    );

    const analyzeReturn = useCallback(
        async (assessmentId: string) => {
            setLoading(true);
            setError(null);
            try {
                const response = await apiClient.analyzeReturn(assessmentId);
                // Refresh assessment after analysis
                await fetchAssessment(assessmentId);
                return response.data;
            } catch (err) {
                handleError(err);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [handleError, fetchAssessment]
    );

    const comparePhotos = useCallback(
        async (assessmentId: string) => {
            setLoading(true);
            setError(null);
            try {
                const response = await apiClient.comparePhotos(assessmentId);
                // Refresh assessment after comparison
                await fetchAssessment(assessmentId);
                return response.data;
            } catch (err) {
                handleError(err);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [handleError, fetchAssessment]
    );

    const getDamageSummary = useCallback(
        async (assessmentId: string) => {
            setLoading(true);
            setError(null);
            try {
                const response = await apiClient.getDamageSummary(assessmentId);
                return response.data;
            } catch (err) {
                handleError(err);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [handleError]
    );

    return {
        assessment,
        loading,
        error,
        createAssessment,
        fetchAssessment,
        uploadPhoto,
        deletePhoto,
        getPhaseStatus,
        analyzePickup,
        analyzeReturn,
        comparePhotos,
        getDamageSummary,
    };
}
