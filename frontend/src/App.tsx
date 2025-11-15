import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { DashboardPage } from './pages/DashboardPage';
import { AssessmentPage } from './pages/AssessmentPage';
import { ReportPage } from './pages/ReportPage';

/**
 * Main Application Component
 * Handles routing and layout structure
 */
function App() {
    return (
        <Router>
            <Toaster
                position="top-right"
                richColors
                closeButton
                expand
            />
            <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/assessment" element={<AssessmentPage />} />
                <Route path="/assessment/:assessmentId" element={<AssessmentPage />} />
                <Route path="/report/:assessmentId" element={<ReportPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
