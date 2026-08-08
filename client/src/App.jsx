// every page of the app and the address that shows it

import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupForm from './pages/SignupForm';
import OffersPage from './pages/OffersPage';
import OfferForm from './pages/OfferForm';
import ComparisonsPage from './pages/ComparisonsPage';
import ComparisonForm from './pages/ComparisonForm';
import ComparisonDetail from './pages/ComparisonDetail';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupForm />} />
            <Route
                path="/offers"
                element={
                    <ProtectedRoute>
                        <OffersPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/offers/new"
                element={
                    <ProtectedRoute>
                        <OfferForm />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/offers/:offerId/edit"
                element={
                    <ProtectedRoute>
                        <OfferForm />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/comparisons"
                element={
                    <ProtectedRoute>
                        <ComparisonsPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/comparisons/new"
                element={
                    <ProtectedRoute>
                        <ComparisonForm />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/comparisons/:comparisonId"
                element={
                    <ProtectedRoute>
                        <ComparisonDetail />
                    </ProtectedRoute>
                }
            />
            <Route path="/" element={<Navigate to="/offers" replace />} />
            <Route path="*" element={<Navigate to="/offers" replace />} />
        </Routes>
    );
}

export default App;
