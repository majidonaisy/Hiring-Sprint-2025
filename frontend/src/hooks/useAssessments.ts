/**
 * useAssessments Hook
 * Manages all assessments state and API calls
 * Used by dashboard to fetch and list all assessments
 */

import { useState, useCallback } from 'react';
import apiClient from '../services/api';
import { Assessment } from '../types';

interface AssessmentsResponse {
    assessments: Assessment[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

interface UseAssessmentsReturn {
    assessments: Assessment[];
    loading: boolean;
    error: string | null;
    pagination: AssessmentsResponse['pagination'] | null;
    fetchAssessments: (page?: number, limit?: number) => Promise<AssessmentsResponse>;
}

export function useAssessments(): UseAssessmentsReturn {
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<AssessmentsResponse['pagination'] | null>(null);

    const handleError = useCallback((err: any) => {
        const errorMessage = err?.response?.data?.error || err?.message || 'An error occurred';
        setError(errorMessage);
        console.error('Assessments Error:', errorMessage);
    }, []);

    const fetchAssessments = useCallback(
        async (page: number = 1, limit: number = 10): Promise<AssessmentsResponse> => {
            setLoading(true);
            setError(null);
            try {
                const response = await apiClient.getAllAssessments(page, limit);

                const data = response as any;
                if (data.data) {
                    setAssessments(data.data);
                }

                if (data.pagination) {
                    setPagination(data.pagination);
                }

                return {
                    assessments: data.data || [],
                    pagination: data.pagination || { page, limit, total: 0, totalPages: 0 },
                };
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
        assessments,
        loading,
        error,
        pagination,
        fetchAssessments,
    };
}

export default useAssessments;
