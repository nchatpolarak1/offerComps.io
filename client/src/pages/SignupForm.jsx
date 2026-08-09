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
    const [fieldErrors, setFieldErrors] = useState({});
    const [formError, setFormError] = useState('');
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
        const errors = {};

        if (fields.firstName.trim() === '') {
            errors.firstName = 'First name is required.';
        }
        if (fields.lastName.trim() === '') {
            errors.lastName = 'Last name is required.';
        }
        if (fields.email.trim() === '') {
            errors.email = 'Email is required.';
        } else if (!emailPattern.test(fields.email.trim())) {
            errors.email = 'Please enter a valid email address.';
        }
        if (fields.password.length < MIN_PASSWORD_LENGTH) {
            errors.password =
                'Password must be at least ' + MIN_PASSWORD_LENGTH + ' characters.';
        }
        if (fields.password !== fields.confirmPassword) {
            errors.confirmPassword = 'The two passwords do not match.';
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
            await auth.register({
                firstName: fields.firstName.trim(),
                lastName: fields.lastName.trim(),
                email: fields.email.trim(),
                password: fields.password
            });
        } catch (error) {
            setFormError(error.message);
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
                        {fieldErrors.firstName && (
                            <span className="field-error">{fieldErrors.firstName}</span>
                        )}
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
                        {fieldErrors.lastName && (
                            <span className="field-error">{fieldErrors.lastName}</span>
                        )}
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
                        {fieldErrors.email && (
                            <span className="field-error">{fieldErrors.email}</span>
                        )}
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
                        {fieldErrors.password && (
                            <span className="field-error">{fieldErrors.password}</span>
                        )}
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
                        {fieldErrors.confirmPassword && (
                            <span className="field-error">{fieldErrors.confirmPassword}</span>
                        )}
                    </label>

                    {formError !== '' && <p className="error">{formError}</p>}

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
