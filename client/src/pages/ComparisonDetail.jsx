// one saved comparison: move the weights and watch the ranking change

import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import apiClient from '../services/apiClient';
import chartColors from '../components/chartColors';
import ScoreRadarChart from '../components/ScoreRadarChart';
import PayBreakdownChart from '../components/PayBreakdownChart';

const WEIGHT_NAMES = ['pay', 'commute', 'hours', 'flexibility'];
const WEIGHT_LABELS = {
    pay: 'Pay',
    commute: 'Commute',
    hours: 'Hours',
    flexibility: 'Flexibility'
};
const DEFAULT_PERCENTS = { pay: 50, commute: 20, hours: 20, flexibility: 10 };

// how long to wait after the last slider move before asking for new scores
const SAVE_DELAY_MS = 400;

function formatMoney(amount) {
    return '$' + Math.round(amount).toLocaleString('en-US');
}

function asPercent(part) {
    return Math.round(part * 100) + '%';
}

// the weights are kept as whole percents while the sliders move, so nothing
// here depends on floating point
function toPercents(weights) {
    const percents = {};

    for (let i = 0; i < WEIGHT_NAMES.length; i++) {
        const name = WEIGHT_NAMES[i];
        percents[name] = Math.round(weights[name] * 100);
    }

    return percents;
}

function toWeights(percents) {
    const weights = {};

    for (let i = 0; i < WEIGHT_NAMES.length; i++) {
        const name = WEIGHT_NAMES[i];
        weights[name] = percents[name] / 100;
    }

    return weights;
}

// the four weights have to add up to exactly 100, so moving one slider takes
// the difference out of the other three in proportion to how big they were
function rebalance(percents, changedName, newPercent) {
    const others = [];
    let otherTotal = 0;

    for (let i = 0; i < WEIGHT_NAMES.length; i++) {
        const name = WEIGHT_NAMES[i];

        if (name !== changedName) {
            others.push(name);
            otherTotal = otherTotal + percents[name];
        }
    }

    const remaining = 100 - newPercent;
    const updated = {};
    updated[changedName] = newPercent;

    for (let i = 0; i < others.length; i++) {
        const name = others[i];

        if (otherTotal === 0) {
            // all three were at zero, so there is no proportion to keep
            updated[name] = Math.round(remaining / others.length);
        } else {
            updated[name] = Math.round((percents[name] * remaining) / otherTotal);
        }
    }

    let total = 0;
    for (let i = 0; i < WEIGHT_NAMES.length; i++) {
        total = total + updated[WEIGHT_NAMES[i]];
    }

    // rounding the shares can leave the total a point or two off, and the
    // server rejects anything that is not exactly 100
    if (total !== 100) {
        let largest = others[0];

        for (let i = 1; i < others.length; i++) {
            if (updated[others[i]] > updated[largest]) {
                largest = others[i];
            }
        }
        updated[largest] = updated[largest] + (100 - total);
    }

    return updated;
}

function partRows(score) {
    return [
        { label: 'Pay', part: score.parts.pay, value: formatMoney(score.values.adjustedPay) },
        {
            label: 'Commute',
            part: score.parts.commute,
            value: score.values.commuteMinutes + ' min'
        },
        { label: 'Hours', part: score.parts.hours, value: score.values.hoursWeek + ' hrs/wk' },
        {
            label: 'Flexibility',
            part: score.parts.flexibility,
            value: score.values.workArrangement
        }
    ];
}

function ComparisonDetail() {
    const params = useParams();
    const comparisonId = params.comparisonId;

    const [comparisonName, setComparisonName] = useState('');
    const [offerIds, setOfferIds] = useState([]);
    const [percents, setPercents] = useState(DEFAULT_PERCENTS);
    const [scores, setScores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [scoring, setScoring] = useState(false);
    const [weightsChanged, setWeightsChanged] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // the saved comparison is loaded first because the offer ids have to go
    // back untouched on every save, or their display order gets rewritten
    useEffect(function () {
        async function load() {
            try {
                const saved = await apiClient.get('/comparisons/' + comparisonId);
                setComparisonName(saved.comparison.comparisonName);
                setOfferIds(saved.comparison.offerIds);
                setPercents(toPercents(saved.comparison.weights));

                const result = await apiClient.get('/comparisons/' + comparisonId + '/scores');
                setScores(result.scores);
            } catch (error) {
                setErrorMessage(error.message);
            }

            setLoading(false);
        }

        load();
    }, [comparisonId]);

    // the sliders move freely and the scores are asked for once the dragging
    // stops, so a long drag is one request instead of dozens
    useEffect(
        function () {
            if (!weightsChanged) {
                return;
            }

            async function saveWeights() {
                setScoring(true);
                setErrorMessage('');

                try {
                    await apiClient.put('/comparisons/' + comparisonId, {
                        comparisonName: comparisonName,
                        weights: toWeights(percents),
                        offerIds: offerIds
                    });

                    // saving clears the cached scores, so these are worked out fresh
                    const result = await apiClient.get(
                        '/comparisons/' + comparisonId + '/scores'
                    );
                    setScores(result.scores);
                    setWeightsChanged(false);
                } catch (error) {
                    setErrorMessage(error.message);
                }

                setScoring(false);
            }

            const timer = setTimeout(function () {
                saveWeights();
            }, SAVE_DELAY_MS);

            return function () {
                clearTimeout(timer);
            };
        },
        [percents, weightsChanged, comparisonId, comparisonName, offerIds]
    );

    function onSlide(name, value) {
        setPercents(rebalance(percents, name, Number(value)));
        setWeightsChanged(true);
    }

    function onReset() {
        setPercents(Object.assign({}, DEFAULT_PERCENTS));
        setWeightsChanged(true);
    }

    let gridClass = 'score-grid';
    if (scoring) {
        gridClass = 'score-grid busy';
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

            <main className="app-main compare-page">
                <div className="panel-header">
                    <h2>{comparisonName}</h2>
                    <Link to="/comparisons" className="button secondary">
                        Back to comparisons
                    </Link>
                </div>

                {errorMessage !== '' && <p className="error">{errorMessage}</p>}

                {loading && <p className="empty">Working out the scores...</p>}

                {!loading && scores.length > 0 && (
                    <div className="compare-layout">
                        <aside className="panel weight-sidebar">
                            <h3>% of importance</h3>

                            {WEIGHT_NAMES.map(function (name) {
                                return (
                                    <div className="weight-row" key={name}>
                                        <span className="weight-head">
                                            <span>{WEIGHT_LABELS[name]}</span>
                                            <span className="weight-value">
                                                {percents[name]}%
                                            </span>
                                        </span>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            step="5"
                                            value={percents[name]}
                                            onChange={function (event) {
                                                onSlide(name, event.target.value);
                                            }}
                                        />
                                    </div>
                                );
                            })}

                            <button type="button" className="button secondary" onClick={onReset}>
                                Reset
                            </button>
                        </aside>

                        <div className="compare-main">
                            <div className={gridClass}>
                                {scores.map(function (score, index) {
                                    return (
                                        <div className="score-card" key={score.offerId}>
                                            <div className="score-head">
                                                <span
                                                    className="score-dot"
                                                    style={{
                                                        backgroundColor: chartColors.colorFor(
                                                            offerIds,
                                                            score.offerId
                                                        )
                                                    }}
                                                ></span>
                                                <span className="score-rank">#{index + 1}</span>
                                            </div>

                                            <span className="offer-company">
                                                {score.companyName}
                                            </span>
                                            <span className="offer-meta">{score.jobTitle}</span>
                                            <span className="offer-meta">
                                                {score.cityName}, {score.stateCode}
                                            </span>

                                            <span className="score-value">{score.score}</span>

                                            <ul className="score-parts">
                                                {partRows(score).map(function (row) {
                                                    return (
                                                        <li className="score-part" key={row.label}>
                                                            <span>{row.label}</span>
                                                            <span className="score-part-value">
                                                                {row.value}
                                                            </span>
                                                            <span>{asPercent(row.part)}</span>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    );
                                })}
                            </div>

                            <section className="panel chart-panel">
                                <h3>Score by category</h3>
                                <div className="chart-box">
                                    <ScoreRadarChart scores={scores} offerIds={offerIds} />
                                </div>
                            </section>

                            <section className="panel chart-panel">
                                <h3>First-year pay: taxes and take-home</h3>
                                <div className="chart-box">
                                    <PayBreakdownChart scores={scores} />
                                </div>
                            </section>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default ComparisonDetail;
