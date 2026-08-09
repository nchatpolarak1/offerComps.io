// holds the login state and the calls that change it

import { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { AuthContext } from './AuthContext';

const TOKEN_KEY = 'jobOffersToken';

function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sessionExpired, setSessionExpired] = useState(false);

    // a saved token means the user was logged in before the page reloaded
    useEffect(function () {
        const savedToken = localStorage.getItem(TOKEN_KEY);

        if (savedToken === null) {
            setLoading(false);
            return;
        }

        apiClient.setToken(savedToken);

        async function restoreSession() {
            try {
                const data = await apiClient.get('/auth/me');
                setUser(data.user);
                setToken(savedToken);
            } catch {
                // the session expired while the page was closed
                localStorage.removeItem(TOKEN_KEY);
                apiClient.setToken(null);
            }
            setLoading(false);
        }

        restoreSession();
    }, []);

    function saveSession(data) {
        localStorage.setItem(TOKEN_KEY, data.token);
        apiClient.setToken(data.token);
        setToken(data.token);
        setUser(data.user);
        setSessionExpired(false);
    }

    function clearSession() {
        localStorage.removeItem(TOKEN_KEY);
        apiClient.setToken(null);
        setToken(null);
        setUser(null);
    }

    // the session can run out while the page is open, so any request that comes
    // back 401 logs out and ProtectedRoute sends the user to the login page
    useEffect(function () {
        apiClient.setUnauthorizedHandler(function () {
            clearSession();
            setSessionExpired(true);
        });
    }, []);

    async function login(email, password) {
        const data = await apiClient.post('/auth/login', {
            email: email,
            password: password
        });
        saveSession(data);
    }

    // registering logs the new user straight in
    async function register(details) {
        const data = await apiClient.post('/auth/register', details);
        saveSession(data);
    }

    async function logout() {
        try {
            await apiClient.post('/auth/logout', {});
        } catch {
            // the session was already gone on the server, log out anyway
        }
        clearSession();
    }

    function isAuthenticated() {
        return user !== null;
    }

    const value = {
        user: user,
        token: token,
        loading: loading,
        sessionExpired: sessionExpired,
        login: login,
        register: register,
        logout: logout,
        isAuthenticated: isAuthenticated
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
