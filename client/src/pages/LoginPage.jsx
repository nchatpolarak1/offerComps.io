// sign in card

import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
    const auth = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [formError, setFormError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (auth.isAuthenticated()) {
        return <Navigate to="/offers" replace />;
    }

    function validate() {
        const errors = {};

        if (email.trim() === '') {
            errors.email = 'Email is required.';
        }
        if (password === '') {
            errors.password = 'Password is required.';
        }

        return errors;
    }

    async function onSubmit(event) {
        event.preventDefault();
        setFormError('');

        const errors = validate();
        setFieldErrors(errors);

        if (Object.keys(errors).length > 0) {
            return;
        }

        setSubmitting(true);
        try {
            await auth.login(email.trim(), password);
        } catch (error) {
            // the server will not say which of the two was wrong, so this one
            // stays at the bottom of the form rather than under a field
            setFormError(error.message);
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
                        {fieldErrors.email && (
                            <span className="field-error">{fieldErrors.email}</span>
                        )}
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
                        {fieldErrors.password && (
                            <span className="field-error">{fieldErrors.password}</span>
                        )}
                    </label>

                    {formError !== '' && <p className="error">{formError}</p>}

                    <button type="submit" className="button primary" disabled={submitting}>
                        {submitting ? 'Signing in...' : 'Log In'}
                    </button>
                </form>

                <p className="card-links">
                    Need an account? <Link to="/signup">Sign up</Link>
                </p>
            </div>
        </main>
    );
}

export default LoginPage;
