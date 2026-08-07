// the "Compare Offers" screen: name a comparison and tick the offers it holds

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';

const MIN_OFFERS = 2;
const MAX_OFFERS = 6;

function formatMoney(amount) {
    return '$' + amount.toLocaleString('en-US');
}

function ComparisonForm() {
    const navigate = useNavigate();
    const [offers, setOffers] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [comparisonName, setComparisonName] = useState('');
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(function () {
        async function loadOffers() {
            try {
                const data = await apiClient.get('/offers');
                setOffers(data.offers);
            } catch (error) {
                setErrorMessage(error.message);
            }

            setLoading(false);
        }

        loadOffers();
    }, []);

    function isSelected(offerId) {
        return selectedIds.indexOf(offerId) !== -1;
    }

    function onToggle(offerId) {
        setErrorMessage('');

        if (isSelected(offerId)) {
            const remaining = [];
            for (let i = 0; i < selectedIds.length; i++) {
                if (selectedIds[i] !== offerId) {
                    remaining.push(selectedIds[i]);
                }
            }
            setSelectedIds(remaining);
            return;
        }

        if (selectedIds.length >= MAX_OFFERS) {
            setErrorMessage('A comparison can hold at most ' + MAX_OFFERS + ' offers.');
            return;
        }

        const updated = selectedIds.slice();
        updated.push(offerId);
        setSelectedIds(updated);
    }

    // the server checks all of this again, this is just faster feedback
    function validate() {
        if (comparisonName.trim() === '') {
            setErrorMessage('Please name this comparison.');
            return false;
        }
        if (selectedIds.length < MIN_OFFERS) {
            setErrorMessage('Choose at least ' + MIN_OFFERS + ' offers to compare.');
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

        setSaving(true);
        try {
            // the weights start at the defaults and are tuned on the comparison page
            await apiClient.post('/comparisons', {
                comparisonName: comparisonName.trim(),
                offerIds: selectedIds
            });
            navigate('/comparisons');
        } catch (error) {
            setErrorMessage(error.message);
            setSaving(false);
        }
    }

    return (
        <div className="app-page">
            <header className="app-header">
                <span className="app-title">Job Offer Comparison Tool</span>
                <nav className="app-nav">
                    <Link to="/offers">My Offers</Link>
                    <Link to="/comparisons">Comparisons</Link>
                </nav>
            </header>

            <main className="app-main form-page">
                <section className="panel">
                    <div className="panel-header">
                        <h2>Compare Offers</h2>
                        <span className="step-hint">
                            {selectedIds.length} of {offers.length} selected
                        </span>
                    </div>

                    {errorMessage !== '' && <p className="error">{errorMessage}</p>}

                    {loading && <p className="empty">Loading your offers...</p>}

                    {!loading && offers.length < MIN_OFFERS && (
                        <p className="empty">
                            You need at least {MIN_OFFERS} saved offers before you can compare
                            them. <Link to="/offers/new">Add another offer</Link>.
                        </p>
                    )}

                    {!loading && offers.length >= MIN_OFFERS && (
                        <form onSubmit={onSubmit}>
                            <label className="field">
                                <span className="field-label">Comparison name</span>
                                <input
                                    type="text"
                                    value={comparisonName}
                                    onChange={function (event) {
                                        setComparisonName(event.target.value);
                                    }}
                                />
                            </label>

                            <span className="field-label">Select offers to compare</span>
                            <ul className="pick-list">
                                {offers.map(function (offer) {
                                    return (
                                        <li key={offer.offerId}>
                                            <label className="pick-row">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected(offer.offerId)}
                                                    onChange={function () {
                                                        onToggle(offer.offerId);
                                                    }}
                                                />
                                                <span className="pick-main">
                                                    <span className="offer-company">
                                                        {offer.companyName}
                                                    </span>
                                                    <span className="offer-meta">
                                                        {offer.jobTitle} &middot; {offer.cityName},{' '}
                                                        {offer.stateCode} &middot;{' '}
                                                        {offer.workArrangement}
                                                    </span>
                                                </span>
                                                <span className="offer-salary">
                                                    {formatMoney(offer.baseSalary)}
                                                </span>
                                            </label>
                                        </li>
                                    );
                                })}
                            </ul>

                            <div className="form-actions">
                                <Link to="/comparisons" className="button secondary">
                                    Cancel
                                </Link>
                                <button type="submit" className="button primary" disabled={saving}>
                                    {saving ? 'Saving...' : 'Compare'}
                                </button>
                            </div>
                        </form>
                    )}
                </section>
            </main>
        </div>
    );
}

export default ComparisonForm;
