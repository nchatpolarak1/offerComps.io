// the logged in user, shared with every component

import { createContext, useContext } from 'react';

export const AuthContext = createContext(null);

export function useAuth() {
    const context = useContext(AuthContext);

    if (context === null) {
        throw new Error('useAuth must be used inside an AuthProvider.');
    }

    return context;
}
