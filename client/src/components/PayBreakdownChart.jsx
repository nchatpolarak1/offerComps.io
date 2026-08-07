// where each offer's first-year gross pay actually goes

import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const TAKE_HOME_COLOR = '#1e5b2e';
const FEDERAL_COLOR = '#b3261e';
const STATE_COLOR = '#8a5a00';

function formatMoney(amount) {
    return '$' + Math.round(amount).toLocaleString('en-US');
}

function PayBreakdownChart({ scores }) {
    const labels = [];
    const takeHome = [];
    const federalTax = [];
    const stateTax = [];

    for (let i = 0; i < scores.length; i++) {
        const breakdown = scores[i].breakdown;

        labels.push(scores[i].companyName);
        takeHome.push(breakdown.takeHome);
        federalTax.push(breakdown.federalTax);
        stateTax.push(breakdown.stateTax);
    }

    const data = {
        labels: labels,
        datasets: [
            { label: 'Take-home', data: takeHome, backgroundColor: TAKE_HOME_COLOR },
            { label: 'Federal tax', data: federalTax, backgroundColor: FEDERAL_COLOR },
            { label: 'State tax', data: stateTax, backgroundColor: STATE_COLOR }
        ]
    };

    // the bars are stacked, so the full height of one is that offer's gross pay
    const options = {
        maintainAspectRatio: false,
        scales: {
            x: {
                stacked: true
            },
            y: {
                stacked: true,
                ticks: {
                    callback: function (value) {
                        return formatMoney(value);
                    }
                }
            }
        },
        plugins: {
            tooltip: {
                callbacks: {
                    label: function (context) {
                        return context.dataset.label + ': ' + formatMoney(context.parsed.y);
                    }
                }
            }
        }
    };

    return <Bar data={data} options={options} />;
}

export default PayBreakdownChart;
