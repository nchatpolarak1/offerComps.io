// create account card

import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MIN_PASSWORD_LENGTH = 8;

function SignupForm() {
    const auth = useAuth();
    const [fields, setFields] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [errorMessage, setErrorMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (auth.isAuthenticated()) {
        return <Navigate to="/offers" replace />;
    }

    function updateField(name, value) {
        const updated = Object.assign({}, fields);
        updated[name] = value;
        setFields(updated);
    }

    // the server checks all of this again, this is just faster feedback
    function validate() {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (fields.firstName.trim() === '') {
            setErrorMessage('First name is required.');
            return false;
        }
        if (fields.lastName.trim() === '') {
            setErrorMessage('Last name is required.');
            return false;
        }
        if (fields.email.trim() === '') {
            setErrorMessage('Email is required.');
            return false;
        }
        if (!emailPattern.test(fields.email.trim())) {
            setErrorMessage('Please enter a valid email address.');
            return false;
        }
        if (fields.password.length < MIN_PASSWORD_LENGTH) {
            setErrorMessage('Password must be at least ' + MIN_PASSWORD_LENGTH + ' characters.');
            return false;
        }
        if (fields.password !== fields.confirmPassword) {
            setErrorMessage('The two passwords do not match.');
            return false;
        }

        return true;
    }

    async function onSubmit(event) {
        event.preventDefault();
        setErrorMessage('');

        if (!validate()) {
            return;
        }

        setSubmitting(true);
        try {
            await auth.register({
                firstName: fields.firstName.trim(),
                lastName: fields.lastName.trim(),
                email: fields.email.trim(),
                password: fields.password
            });
        } catch (error) {
            setErrorMessage(error.message);
            setSubmitting(false);
        }
    }

    return (
        <main className="auth-page">
            <div className="card">
                <h1 className="card-title">Create an account</h1>
                <p className="card-subtitle">Save your offers and compare them side by side.</p>

                <form onSubmit={onSubmit}>
                    <label className="field">
                        <span className="field-label">First name</span>
                        <input
                            type="text"
                            value={fields.firstName}
                            onChange={function (event) {
                                updateField('firstName', event.target.value);
                            }}
                        />
                    </label>

                    <label className="field">
                        <span className="field-label">Last name</span>
                        <input
                            type="text"
                            value={fields.lastName}
                            onChange={function (event) {
                                updateField('lastName', event.target.value);
                            }}
                        />
                    </label>

                    <label className="field">
                        <span className="field-label">Email</span>
                        <input
                            type="email"
                            value={fields.email}
                            onChange={function (event) {
                                updateField('email', event.target.value);
                            }}
                        />
                    </label>

                    <label className="field">
                        <span className="field-label">Password</span>
                        <input
                            type="password"
                            value={fields.password}
                            onChange={function (event) {
                                updateField('password', event.target.value);
                            }}
                        />
                    </label>

                    <label className="field">
                        <span className="field-label">Confirm password</span>
                        <input
                            type="password"
                            value={fields.confirmPassword}
                            onChange={function (event) {
                                updateField('confirmPassword', event.target.value);
                            }}
                        />
                    </label>

                    {errorMessage !== '' && <p className="error">{errorMessage}</p>}

                    <button type="submit" className="button primary" disabled={submitting}>
                        {submitting ? 'Creating account...' : 'Sign Up'}
                    </button>
                </form>

                <p className="card-links">
                    Already have an account? <Link to="/login">Log in</Link>
                </p>
            </div>
        </main>
    );
}

export default SignupForm;
