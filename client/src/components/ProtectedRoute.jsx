// keeps signed out visitors away from the pages that need an account

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }) {
    const auth = useAuth();

    // wait for the saved token to be checked before deciding
    if (auth.loading) {
        return null;
    }

    if (!auth.isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

export default ProtectedRoute;
