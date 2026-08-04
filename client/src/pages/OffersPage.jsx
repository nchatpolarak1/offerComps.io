// the page shown after logging in

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function OffersPage() {
    const auth = useAuth();
    const [offers] = useState([]);

    async function onLogOut() {
        await auth.logout();
    }

    return (
        <div className="app-page">
            <header className="app-header">
                <span className="app-title">Job Offer Comparison Tool</span>
                <nav className="app-nav">
                    <Link to="/offers">Home</Link>
                    <button type="button" className="link-button" disabled>
                        New Offer
                    </button>
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
                        <button type="button" className="button primary" disabled>
                            + New Offer
                        </button>
                    </div>

                    {offers.length === 0 && (
                        <p className="empty">You have not added any offers yet.</p>
                    )}
                </section>
            </main>
        </div>
    );
}

export default OffersPage;
