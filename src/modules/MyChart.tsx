import { createEffect, createSignal, onMount } from 'solid-js'
import { Chart, Title, Tooltip, Legend, Colors, TimeScale, registerables } from 'chart.js'
import 'chartjs-adapter-moment';
import { Line, Scatter } from 'solid-chartjs'
import zoomPlugin from 'chartjs-plugin-zoom';

type CsvEntry = {
    current_time: string;
    post_time: string;
    id: string;
    title: string;
    score: string;
    rank: string;
    comments: string;
};

type AggregatedEntry = {
    id: string;
    title: string;
    current_times: number[];
    post_time: number;
    scores: number[];
    ranks: number[];
    comments: number[];
    hotnesses?: number[];
};

function parseCSV(csvData: string): CsvEntry[] {
    const lines = csvData.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

    const result: CsvEntry[] = [];

    for (let i = 1; i < lines.length; i++) {
        const currentLine = lines[i].split(',').map(field => field.trim().replace(/"/g, ''));
        const entry: CsvEntry = headers.reduce((obj, nextKey, index) => {
            obj[nextKey as keyof CsvEntry] = currentLine[index];
            return obj;
        }, {} as CsvEntry);
        result.push(entry);
    }

    return result;
}


function aggregateData(entries: CsvEntry[]): AggregatedEntry[] {
    const grouped: Record<string, AggregatedEntry> = {};

    entries.forEach(entry => {
        if (!grouped[entry.id]) {
            grouped[entry.id] = {
                id: entry.id,
                title: entry.title,
                current_times: [],
                post_time: parseInt(entry.post_time),
                ranks: [],
                scores: [],
                comments: []
            };
        }

        grouped[entry.id].current_times.push(parseInt(entry.current_time));
        grouped[entry.id].scores.push(parseInt(entry.score));
        grouped[entry.id].comments.push(parseInt(entry.comments));
        grouped[entry.id].ranks.push(parseInt(entry.rank));
    });

    return Object.values(grouped);
}

// Function to add hotnesses to each post
const decay_constant = 0.0000572 / 1000
function addHotnessToPosts(posts: AggregatedEntry[]) {
    posts.forEach(post => {
        const timeCreated = post.post_time;
        post.hotnesses = post.scores.map((score: number, index: number) => {
            const timeSincePosted = post.current_times[index] - timeCreated;
            return score * Math.exp(-decay_constant * timeSincePosted)
        });
    });
}

export const MyChart = () => {
    /**
     * You must register optional elements before using the chart,
     * otherwise you will have the most primitive UI
     */
    onMount(() => {
        Chart.register(Title, Tooltip, Legend, Colors, zoomPlugin, ...registerables);
        loadData();
    });

    const [chartData, setChartData] = createSignal<any>({ datasets: [] });

    const loadData = async () => {
        const spreadsheetUrl = 'https://docs.google.com/spreadsheets/d/1XbSqIH7CzYTgKkjVmGP3FFPHs1sqM3D3aj7O4lFPfn0/gviz/tq?tqx=out:csv';

        try {
            const response = await fetch(spreadsheetUrl);

            // Process data
            const parsedData = parseCSV(await response.text());
            const aggregatedData = aggregateData(parsedData);
            addHotnessToPosts(aggregatedData);

            // Preparing data for Chart.js
            const datasets = aggregatedData.map(item => {
                // Creating data points where each point is an object { x: time, y: score or comment }
                const dataPoints = item.current_times.map((time, index) => {
                    return {
                        // x: new Date(time * 1000),
                        x: time,
                        // y: item.scores[index]
                        y: item.hotnesses![index]
                    }; // Or item.comments[index]
                });

                return {
                    label: item.title,
                    data: dataPoints,
                    showLine: true,
                    pointRadius: 0,
                    // fill: false,
                    // borderColor: getRandomColor(),
                    // tension: 0.1
                };
            });

            // console.log(datasets);

            setChartData({ datasets: datasets });

        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    const intToDate = (value: number) => {
        const date = new Date(value);

        // Formatting the day of the week
        const dayOfWeek = date.toLocaleDateString(undefined, { weekday: 'short' });

        // Formatting the time in 24-hour format with no seconds
        const time = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });

        return `${dayOfWeek} ${time}`;
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'nearest',
            intersect: false,
        },
        plugins: {
            legend: {
                display: false // This will hide the legend
            },
            tooltip: {
                callbacks: {
                    label: function (context: any) {
                        const datasetLabel = context.dataset.label;
                        const xValue = context.raw.x;
                        const yValue = context.raw.y;
                        return [datasetLabel, intToDate(xValue as number), Math.round(yValue)];
                    }
                }
            },
            zoom: {
                pan: {
                    enabled: true,
                    mode: 'xy',
                },
                zoom: {
                    wheel: {
                        enabled: true,
                    },
                    pinch: {
                        enabled: true
                    },
                    mode: 'xy',
                    // drag: {
                    //     enabled: true,
                    //     borderColor: 'rgb(54, 162, 235)',
                    //     borderWidth: 1,
                    //     backgroundColor: 'rgba(54, 162, 235, 0.3)',
                    //     modifierKey: 'ctrl',
                    // }
                }
            }

        },
        scales: {
            x: {
                position: 'bottom',
                ticks: {
                    callback: intToDate,
                }
            }
        }
    }

    return (
        <>
            <div>
                <Scatter
                    data={chartData()}
                    options={chartOptions}
                    width={window.innerWidth - 50}
                    height={window.innerHeight - 50}
                />
            </div>
            {/* <button onclick={e => {
                const tempData = chartData();
                tempData.datasets[0]["data"] = tempData.datasets[0]["data"].map((entry: {x: number, y: number}) => {
                    return {x: entry.x, y: entry.y - 10};
                });
                console.log(chartData().datasets[0]["data"][0], tempData.datasets[0]["data"][0])
                setChartData(tempData);
            }}> Click </button> */}
        </>
    )
}