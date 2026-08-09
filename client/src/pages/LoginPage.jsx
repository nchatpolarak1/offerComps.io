// sign in card

import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
    const auth = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (auth.isAuthenticated()) {
        return <Navigate to="/offers" replace />;
    }

    async function onSubmit(event) {
        event.preventDefault();
        setErrorMessage('');

        if (email.trim() === '' || password === '') {
            setErrorMessage('Please enter your email and password.');
            return;
        }

        setSubmitting(true);
        try {
            await auth.login(email.trim(), password);
        } catch (error) {
            setErrorMessage(error.message);
            setSubmitting(false);
        }
    }

    return (
        <main className="auth-page">
            <div className="card">
                <h1 className="card-title">Job Offer Comparison Tool</h1>
                <p className="card-subtitle">Sign in to compare your offers.</p>

                {auth.sessionExpired && (
                    <p className="error">Your session timed out. Please log in again.</p>
                )}

                <form onSubmit={onSubmit}>
                    <label className="field">
                        <span className="field-label">Email</span>
                        <input
                            type="email"
                            value={email}
                            onChange={function (event) {
                                setEmail(event.target.value);
                            }}
                        />
                    </label>

                    <label className="field">
                        <span className="field-label">Password</span>
                        <input
                            type="password"
                            value={password}
                            onChange={function (event) {
                                setPassword(event.target.value);
                            }}
                        />
                    </label>

                    {errorMessage !== '' && <p className="error">{errorMessage}</p>}

                    <button type="submit" className="button primary" disabled={submitting}>
                        {submitting ? 'Signing in...' : 'Log In'}
                    </button>
                </form>

                <p className="card-links">
                    <a href="#forgot-password">Forgot password?</a>
                </p>
                <p className="card-links">
                    Need an account? <Link to="/signup">Sign up</Link>
                </p>
            </div>
        </main>
    );
}

export default LoginPage;
