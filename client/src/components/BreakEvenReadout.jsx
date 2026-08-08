// what each offer would have to pay to match the best-paying one, and why

function formatMoney(amount) {
    return '$' + Math.round(amount).toLocaleString('en-US');
}

// how much dearer this city is than the one the best-paying offer is in
function costPercentMore(offer, best) {
    return Math.round((offer.colIndex / best.colIndex - 1) * 100);
}

function BreakEvenReadout({ breakEven }) {
    let best = breakEven.offers[0];
    const behind = [];

    for (let i = 0; i < breakEven.offers.length; i++) {
        const offer = breakEven.offers[i];

        if (offer.offerId === breakEven.bestOfferId) {
            best = offer;
        }
        if (offer.neededBaseSalary !== null) {
            behind.push(offer);
        }
    }

    return (
        <div>
            <p className="insight-lead">
                <strong>{breakEven.bestCompanyName}</strong> pays the most once income tax and
                the cost of living are taken out. The take-home figures are closer than the
                adjusted ones, so most of the gap is the cost of living rather than the pay.
            </p>

            <div className="table-scroll">
                <table className="insight-table">
                    <thead>
                        <tr>
                            <th>Offer</th>
                            <th>Gross</th>
                            <th>Tax</th>
                            <th>Take-home</th>
                            <th>Cost of living</th>
                            <th>What it is worth</th>
                        </tr>
                    </thead>
                    <tbody>
                        {breakEven.offers.map(function (offer) {
                            return (
                                <tr key={offer.offerId}>
                                    <td>
                                        {offer.companyName}
                                        <span className="offer-meta">
                                            {' '}
                                            {offer.cityName}, {offer.stateCode}
                                        </span>
                                    </td>
                                    <td className="number">{formatMoney(offer.gross)}</td>
                                    <td className="number">
                                        {formatMoney(offer.federalTax + offer.stateTax)}
                                    </td>
                                    <td className="number">{formatMoney(offer.takeHome)}</td>
                                    <td className="number">{offer.colIndex}</td>
                                    <td className="number">
                                        <strong>{formatMoney(offer.adjustedPay)}</strong>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {behind.length === 0 && (
                <p className="offer-meta">There is nothing to make up on any of the others.</p>
            )}

            <ul className="insight-list">
                {behind.map(function (offer) {
                    return (
                        <li key={offer.offerId}>
                            <strong>{offer.companyName}</strong> takes home{' '}
                            {formatMoney(offer.takeHome)} against {best.companyName}&apos;s{' '}
                            {formatMoney(best.takeHome)}.{' '}
                            {offer.colIndex > best.colIndex && (
                                <span>
                                    {offer.cityName} costs about{' '}
                                    <strong>{costPercentMore(offer, best)}% more</strong> to live
                                    in than {best.cityName}, so{' '}
                                </span>
                            )}
                            {offer.colIndex <= best.colIndex && <span>Adjusted for cost of living, </span>}
                            that pay is worth {formatMoney(offer.adjustedPay)} next to{' '}
                            {formatMoney(best.adjustedPay)}. To match it,{' '}
                            {offer.companyName} would have to offer a base salary of{' '}
                            <strong>{formatMoney(offer.neededBaseSalary)}</strong> &mdash;{' '}
                            {formatMoney(offer.raise)} more than today, and about{' '}
                            {formatMoney(offer.taxOnRaise)} of that raise would go straight to
                            tax.
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

export default BreakEvenReadout;
