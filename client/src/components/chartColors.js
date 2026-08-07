// one colour per offer, shared by the score cards and the charts

const CHART_COLORS = ['#2c4a7c', '#b3261e', '#1e5b2e', '#8a5a00', '#5c3a7c', '#0f6b78'];

// the colour follows the offer, not its rank, so a company keeps the same
// colour when the ranking moves around
function colorFor(offerIds, offerId) {
    let index = offerIds.indexOf(offerId);

    if (index === -1) {
        index = 0;
    }
    return CHART_COLORS[index % CHART_COLORS.length];
}

export default {
    colors: CHART_COLORS,
    colorFor: colorFor
};
