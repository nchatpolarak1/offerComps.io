// how each offer scores on the four things being weighed

import { Radar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
} from 'chart.js';
import chartColors from './chartColors';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const AXIS_LABELS = ['Pay', 'Commute', 'Hours', 'Flexibility'];

// the line is drawn solid and the area under it see-through
function fadedColor(color) {
    return color + '33';
}

function ScoreRadarChart({ scores, offerIds }) {
    const datasets = [];

    for (let i = 0; i < scores.length; i++) {
        const score = scores[i];
        const color = chartColors.colorFor(offerIds, score.offerId);

        datasets.push({
            label: score.companyName,
            data: [
                score.parts.pay * 100,
                score.parts.commute * 100,
                score.parts.hours * 100,
                score.parts.flexibility * 100
            ],
            borderColor: color,
            backgroundColor: fadedColor(color),
            pointBackgroundColor: color
        });
    }

    const data = {
        labels: AXIS_LABELS,
        datasets: datasets
    };

    // the scale is pinned so the shapes stay comparable as the weights move
    const options = {
        maintainAspectRatio: false,
        scales: {
            r: {
                min: 0,
                max: 100,
                ticks: {
                    stepSize: 25
                }
            }
        }
    };

    return <Radar data={data} options={options} />;
}

export default ScoreRadarChart;
