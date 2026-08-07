// one color per offer, shared by the score cards and the charts

const CHART_COLORS = ['#4b87e9', '#ff6b6b', '#46c2ad', '#8bc64e', '#dda1df', '#3bc1db'];

// the color follows the offer, not its rank, so a company keeps the same
// color when the ranking moves around
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
