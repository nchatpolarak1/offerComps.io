// what each offer would have to pay to match the best-paying one

function formatMoney(amount) {
    return '$' + Math.round(amount).toLocaleString('en-US');
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
                Best offer after tax and cost of living: {breakEven.bestCompanyName}.
            </p>

            <div className="table-scroll">
                <table className="insight-table">
                    <thead>
                        <tr>
                            <th>Offer</th>
                            <th>Take-home</th>
                            <th>Cost of living</th>
                            <th>Worth</th>
                            <th>Needs base</th>
                        </tr>
                    </thead>
                    <tbody>
                        {breakEven.offers.map(function (offer) {
                            let needsBase = '-';
                            if (offer.neededBaseSalary !== null) {
                                needsBase = formatMoney(offer.neededBaseSalary);
                            }

                            return (
                                <tr key={offer.offerId}>
                                    <td>
                                        {offer.companyName}
                                        <span className="offer-meta"> {offer.cityName}, {offer.stateCode}</span>
                                    </td>
                                    <td className="number">{formatMoney(offer.takeHome)}</td>
                                    <td className="number">{offer.colIndex}</td>
                                    <td className="number">{formatMoney(offer.adjustedPay)}</td>
                                    <td className="number">{needsBase}</td>
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
                            {offer.companyName} needs {formatMoney(offer.raise)} more base pay to
                            match {best.companyName}.
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

export default BreakEvenReadout;
