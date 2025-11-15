/**
 * Demo Mode Service
 * Creates a pre-filled assessment with sample images for testing
 */

import apiClient from './api';
import { toast } from 'sonner';

export async function createDemoAssessment(): Promise<string> {
    const toastId = toast.loading('Starting demo assessment creation...');

    try {
        // Create assessment
        toast.loading('Step 1/6: Creating assessment...', { id: toastId });
        const response = await apiClient.post('/assessments', {
            vehicleId: 'DEMO-001',
            vehicleName: 'Demo Volkswagen Golf TDI 2005',
        });

        const assessmentId = response.data.id;
        toast.success('✓ Assessment created!', { id: toastId });


        // Sample car damage images from public sources
        const demoImages = {
            pickup: {
                front: 'https://jvpwfcwkechexlmrfikm.supabase.co/storage/v1/object/public/car-images/test-data/volk-front-good.jpg',
                rear: 'https://jvpwfcwkechexlmrfikm.supabase.co/storage/v1/object/public/car-images/test-data/volk-back-good.jpg',
                driver_side: 'https://jvpwfcwkechexlmrfikm.supabase.co/storage/v1/object/public/car-images/test-data/volk-side-good.jpeg',
                passenger_side: 'https://jvpwfcwkechexlmrfikm.supabase.co/storage/v1/object/public/car-images/test-data/volk-side-good.jpeg',
                roof: 'https://jvpwfcwkechexlmrfikm.supabase.co/storage/v1/object/public/car-images/test-data/volk-roof-good.jpg'
            },
            return: {
                front: 'https://jvpwfcwkechexlmrfikm.supabase.co/storage/v1/object/public/car-images/test-data/volk-front-good.jpg',
                rear: 'https://jvpwfcwkechexlmrfikm.supabase.co/storage/v1/object/public/car-images/test-data/volk-back-damaged-2.jpg',
                driver_side: 'https://jvpwfcwkechexlmrfikm.supabase.co/storage/v1/object/public/car-images/test-data/volk-side-good.jpeg',
                passenger_side: 'https://jvpwfcwkechexlmrfikm.supabase.co/storage/v1/object/public/car-images/test-data/volk-side-good.jpeg',
                roof: 'https://jvpwfcwkechexlmrfikm.supabase.co/storage/v1/object/public/car-images/test-data/volk-roof-good.jpg'
            }
        };

        // Upload pickup photos
        const toastId2 = toast.loading('Step 2/6: Uploading pickup photos (5 angles)...');
        for (const [angle, url] of Object.entries(demoImages.pickup)) {
            await apiClient.post(`/assessments/${assessmentId}/photos/${angle}/pickup`, {
                filename: `${angle}_pickup.jpg`,
                storagePath: url,
                fileSize: 100000
            });
        }
        toast.success('✓ Pickup photos uploaded!', { id: toastId2 });

        // Analyze pickup
        const toastId3 = toast.loading('Step 3/6: Analyzing pickup photos with AI...');
        await apiClient.post(`/assessments/${assessmentId}/analyze/pickup`);
        toast.success('✓ Pickup analysis complete!', { id: toastId3 });

        // Upload return photos
        const toastId4 = toast.loading('Step 4/6: Uploading return photos (5 angles)...');
        for (const [angle, url] of Object.entries(demoImages.return)) {
            await apiClient.post(`/assessments/${assessmentId}/photos/${angle}/return`, {
                filename: `${angle}_return.jpg`,
                storagePath: url,
                fileSize: 100000
            });
        }
        toast.success('✓ Return photos uploaded!', { id: toastId4 });

        // Analyze return
        const toastId5 = toast.loading('Step 5/6: Analyzing return photos with AI...');
        await apiClient.post(`/assessments/${assessmentId}/analyze/return`);
        toast.success('✓ Return analysis complete!', { id: toastId5 });

        // Compare
        const toastId6 = toast.loading('Step 6/6: Comparing pickup vs return and detecting new damages...');
        await apiClient.post(`/assessments/${assessmentId}/compare`);
        toast.success('✓ Comparison complete!', { id: toastId6 });

        toast.success('✅ Demo assessment ready! Redirecting...');

        return assessmentId;
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create demo assessment';
        toast.error(errorMessage, { id: toastId });
        throw err;
    }
}
