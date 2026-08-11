import { Link } from 'react-router-dom';

function formatMoney(amount) {
    return '$' + amount.toLocaleString('en-US');
}

function OfferCard({ offer, onDelete, busy }) {
    const location = offer.cityName + ', ' + offer.stateCode;

    let perkSummary = 'No perks saved';
    if (offer.perks.length === 1) {
        perkSummary = '1 perk';
    } else if (offer.perks.length > 1) {
        perkSummary = offer.perks.length + ' perks';
    }

    const metaText = location + ' · ' + offer.workArrangement + ' · ' +
        offer.expectedHoursWeek + ' hrs/week · ' + perkSummary;

    function onDeleteClick() {
        const message =
            'Delete the ' + offer.jobTitle + ' offer from ' + offer.companyName + '?';
        if (window.confirm(message)) {
            onDelete(offer.offerId);
        }
    }

    return (
        <li className="offer-row">
            <div className="offer-main">
                <span className="offer-company">{offer.companyName}</span>
                <span className="offer-title">{offer.jobTitle}</span>
                <span className="offer-meta">{metaText}</span>
            </div>

            <div className="offer-side">
                <span className="offer-salary">{formatMoney(offer.baseSalary)}</span>
                <span className={'status-badge status-' + offer.offerStatus}>
                    {offer.offerStatus}
                </span>
            </div>

            <div className="offer-actions">
                <Link to={'/offers/' + offer.offerId + '/edit'} className="button secondary">
                    Edit
                </Link>
                <button
                    type="button"
                    className="button danger"
                    onClick={onDeleteClick}
                    disabled={busy}
                >
                    Delete
                </button>
            </div>
        </li>
    );
}

export default OfferCard;
