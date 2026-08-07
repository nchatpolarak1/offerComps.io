// what each offer would have to pay to match the best-paying one

function formatMoney(amount) {
    return '$' + Math.round(amount).toLocaleString('en-US');
}

function BreakEvenReadout({ breakEven }) {
    const behind = [];

    for (let i = 0; i < breakEven.offers.length; i++) {
        if (breakEven.offers[i].neededBaseSalary !== null) {
            behind.push(breakEven.offers[i]);
        }
    }

    return (
        <div>
            <p className="insight-lead">
                <strong>{breakEven.bestCompanyName}</strong> pays the most once income tax and
                the cost of living are taken out.
            </p>

            {behind.length === 0 && (
                <p className="offer-meta">There is nothing to make up on any of the others.</p>
            )}

            <ul className="insight-list">
                {behind.map(function (offer) {
                    const raise = offer.neededBaseSalary - offer.baseSalary;

                    return (
                        <li key={offer.offerId}>
                            <strong>{offer.companyName}</strong> would need a base salary of{' '}
                            <strong>{formatMoney(offer.neededBaseSalary)}</strong> in{' '}
                            {offer.cityName} to match {breakEven.bestCompanyName} &mdash; that is{' '}
                            {formatMoney(raise)} on top of the {formatMoney(offer.baseSalary)} it
                            offers today.
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

export default BreakEvenReadout;
