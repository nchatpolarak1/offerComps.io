// the saved comparisons a user has built

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';

function ComparisonsPage() {
    const auth = useAuth();
    const [comparisons, setComparisons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [deletingId, setDeletingId] = useState(0);

    async function loadComparisons() {
        setLoading(true);
        setErrorMessage('');

        try {
            const data = await apiClient.get('/comparisons');
            setComparisons(data.comparisons);
        } catch (error) {
            setErrorMessage(error.message);
        }

        setLoading(false);
    }

    useEffect(function () {
        loadComparisons();
    }, []);

    async function onDelete(comparison) {
        const message = 'Delete the comparison "' + comparison.comparisonName + '"?';
        if (!window.confirm(message)) {
            return;
        }

        setDeletingId(comparison.comparisonId);
        setErrorMessage('');

        try {
            await apiClient.del('/comparisons/' + comparison.comparisonId);
            const remaining = [];
            for (let i = 0; i < comparisons.length; i++) {
                if (comparisons[i].comparisonId !== comparison.comparisonId) {
                    remaining.push(comparisons[i]);
                }
            }
            setComparisons(remaining);
        } catch (error) {
            setErrorMessage(error.message);
        }

        setDeletingId(0);
    }

    async function onLogOut() {
        await auth.logout();
    }

    // the server only sends a ranking when the scores are still cached
    function topScoreText(comparison) {
        if (comparison.ranking === null || comparison.ranking.length === 0) {
            return 'Not scored yet';
        }
        return 'Top score ' + comparison.ranking[0].score;
    }

    function asPercent(weight) {
        return Math.round(weight * 100) + '%';
    }

    function offerCountText(comparison) {
        if (comparison.offerIds.length === 1) {
            return '1 offer';
        }
        return comparison.offerIds.length + ' offers';
    }

    function weightsText(comparison) {
        return 'Pay ' + asPercent(comparison.weights.pay) +
            ' · Commute ' + asPercent(comparison.weights.commute) +
            ' · Hours ' + asPercent(comparison.weights.hours) +
            ' · Flexibility ' + asPercent(comparison.weights.flexibility);
    }

    return (
        <div className="app-page">
            <header className="app-header">
                <span className="app-title">Job Offer Comparison Tool</span>
                <nav className="app-nav">
                    <Link to="/offers">My Offers</Link>
                    <Link to="/comparisons/new">New Comparison</Link>
                    <button type="button" className="link-button" onClick={onLogOut}>
                        Log Out
                    </button>
                </nav>
            </header>

            <main className="app-main">
                <section className="panel">
                    <div className="panel-header">
                        <h2>My Comparisons</h2>
                        <Link to="/comparisons/new" className="button primary">
                            + New Comparison
                        </Link>
                    </div>

                    {errorMessage !== '' && <p className="error">{errorMessage}</p>}

                    {loading && <p className="empty">Loading your comparisons...</p>}

                    {!loading && comparisons.length === 0 && (
                        <p className="empty">
                            You have not built any comparisons yet. Add at least two offers,
                            then compare them side by side.
                        </p>
                    )}

                    {!loading && comparisons.length > 0 && (
                        <ul className="offer-list">
                            {comparisons.map(function (comparison) {
                                return (
                                    <li className="offer-row" key={comparison.comparisonId}>
                                        <div className="offer-main">
                                            <Link
                                                className="offer-company"
                                                to={'/comparisons/' + comparison.comparisonId}
                                            >
                                                {comparison.comparisonName}
                                            </Link>
                                            <span className="offer-meta">
                                                {offerCountText(comparison) + ' · ' + topScoreText(comparison)}
                                            </span>
                                            <span className="offer-meta">
                                                {weightsText(comparison)}
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            className="button danger"
                                            onClick={function () {
                                                onDelete(comparison);
                                            }}
                                            disabled={deletingId === comparison.comparisonId}
                                        >
                                            Delete
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>
            </main>
        </div>
    );
}

export default ComparisonsPage;
