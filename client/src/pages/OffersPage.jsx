// the page shown after logging in

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';
import OfferCard from '../components/OfferCard';

function OffersPage() {
    const auth = useAuth();
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [deletingId, setDeletingId] = useState(0);

    async function loadOffers() {
        setLoading(true);
        setErrorMessage('');

        try {
            const data = await apiClient.get('/offers');
            setOffers(data.offers);
        } catch (error) {
            setErrorMessage(error.message);
        }

        setLoading(false);
    }

    useEffect(function () {
        loadOffers();
    }, []);

    async function onDelete(offerId) {
        setDeletingId(offerId);
        setErrorMessage('');

        try {
            await apiClient.del('/offers/' + offerId);
            const remaining = [];
            for (let i = 0; i < offers.length; i++) {
                if (offers[i].offerId !== offerId) {
                    remaining.push(offers[i]);
                }
            }
            setOffers(remaining);
        } catch (error) {
            setErrorMessage(error.message);
        }

        setDeletingId(0);
    }

    async function onLogOut() {
        await auth.logout();
    }

    return (
        <div className="app-page">
            <header className="app-header">
                <span className="app-title">Job Offer Comparison Tool</span>
                <nav className="app-nav">
                    <Link to="/offers">Home</Link>
                    <Link to="/offers/new">New Offer</Link>
                    <Link to="/comparisons">Comparisons</Link>
                    <button type="button" className="link-button" onClick={onLogOut}>
                        Log Out
                    </button>
                </nav>
            </header>

            <main className="app-main">
                <p className="greeting">Welcome back, {auth.user.firstName}.</p>

                <section className="panel">
                    <div className="panel-header">
                        <h2>My Offers</h2>
                        <Link to="/offers/new" className="button primary">
                            + New Offer
                        </Link>
                    </div>

                    {errorMessage !== '' && <p className="error">{errorMessage}</p>}

                    {loading && <p className="empty">Loading your offers...</p>}

                    {!loading && offers.length === 0 && (
                        <p className="empty">You have not added any offers yet.</p>
                    )}

                    {!loading && offers.length > 0 && (
                        <ul className="offer-list">
                            {offers.map(function (offer) {
                                return (
                                    <OfferCard
                                        key={offer.offerId}
                                        offer={offer}
                                        onDelete={onDelete}
                                        busy={deletingId === offer.offerId}
                                    />
                                );
                            })}
                        </ul>
                    )}
                </section>
            </main>
        </div>
    );
}

export default OffersPage;
