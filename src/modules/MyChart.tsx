import { createEffect, createSignal, onMount } from 'solid-js'
import { Chart, registerables } from 'chart.js'
import 'chartjs-adapter-moment';
import zoomPlugin from 'chartjs-plugin-zoom';
import annotationPlugin from 'chartjs-plugin-annotation';
import { Controls, getModeTypeTitle, mode } from './Controls';

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

    // Regular expression to match CSV fields, considering quoted strings
    const regex = /(".*?"|[^",]+)(?=\s*,|\s*$)/g;

    // Extract headers
    const headers = lines[0].match(regex)?.map(h => h.trim().replace(/"/g, '')) || [];

    const result: CsvEntry[] = [];

    for (let i = 1; i < lines.length; i++) {
        const fields = lines[i].match(regex)?.map(field => field.trim().replace(/"/g, '')) || [];
        const entry: CsvEntry = headers.reduce((obj, nextKey, index) => {
            obj[nextKey as keyof CsvEntry] = fields[index] || '';
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
const decay_constant = 5.1966223406838415e-08;
function addHotnessToPosts(posts: AggregatedEntry[]) {
    posts.forEach(post => {
        const timeCreated = post.post_time;
        post.hotnesses = post.scores.map((score: number, index: number) => {
            const timeSincePosted = post.current_times[index] - timeCreated;
            return score * Math.exp(-decay_constant * timeSincePosted)
        });
    });
}

export const loadData = async () => {
    const spreadsheetUrl = 'https://docs.google.com/spreadsheets/d/1XbSqIH7CzYTgKkjVmGP3FFPHs1sqM3D3aj7O4lFPfn0/gviz/tq?tqx=out:csv';

    try {
        const response = await fetch(spreadsheetUrl);

        // Process data
        const parsedData = parseCSV(await response.text());
        const aggregatedData = aggregateData(parsedData);
        addHotnessToPosts(aggregatedData);

        setData(aggregatedData);

    } catch (error) {
        console.error('Error loading data:', error);
    }
};

export let chart: Chart | undefined = undefined;
// export const [chart, setChart] = createSignal<Chart>();
export const [data, setData] = createSignal<AggregatedEntry[]>([]);

export const MyChart = () => {
    /**
     * You must register optional elements before using the chart,
     * otherwise you will have the most primitive UI
     */

    let ref: HTMLCanvasElement | undefined = undefined;

    onMount(async () => {

        Chart.register(...registerables, zoomPlugin, annotationPlugin);
        chart = new Chart(ref!, {
            type: 'scatter',
            data: { datasets: [] },
            options: {
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
                            mode: 'x',
                        },
                        zoom: {
                            wheel: {
                                enabled: true,
                            },
                            pinch: {
                                enabled: true
                            },
                            mode: 'x',
                            // drag: {
                            //     enabled: true,
                            //     borderColor: 'rgb(54, 162, 235)',
                            //     borderWidth: 1,
                            //     backgroundColor: 'rgba(54, 162, 235, 0.3)',
                            //     modifierKey: 'ctrl',
                            // }
                        }
                    },
                    annotation: {
                        annotations: {

                        }
                    }

                },
                scales: {
                    x: {
                        type: 'time',
                        position: 'bottom',
                        title: {
                            display: true,
                            text: "Time"
                        },
                        time: {
                            displayFormats: {
                                day: 'MMM DD HH:mm',
                                hour: 'HH:mm',
                                minute: 'HH:mm',
                                second: 'HH:mm:ss',
                            }
                        },
                        ticks: {
                            major: {
                                enabled: true,
                                // fontStyle: 'bold', //You can also style these values differently
                                // fontSize: 14 //You can also style these values differently
                            },
                        },
                    },
                    y: {
                        title: {
                            display: true,
                        }
                    }
                }
            }
        });

        loadData();
    });

    createEffect(() => {
        if (chart) {
            const datasets = data().map(item => {
                // Creating data points where each point is an object { x: time, y: score or comment }
                const dataPoints = item.current_times.map((time, index) => {
                    return {
                        // x: new Date(time * 1000),
                        x: time,
                        y: item[mode()]![index]
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
                    borderJoinStyle: 'bevel',
                };
            });

            chart.data.datasets = datasets;
            chart.update();
        }
    });

    createEffect(() => {
        if (chart) {
            (chart.options.scales as any).y.title.text = getModeTypeTitle(mode());
        }
    });

    const intToDate = (value: number | string) => {
        const date = new Date(value);

        // Formatting the day of the week
        const dayOfWeek = date.toLocaleDateString(undefined, { weekday: 'short' });

        // Formatting the time in 24-hour format with no seconds
        const time = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });

        return `${dayOfWeek} ${time}`;
    };

    return (
        <>
            <div class="chart-container" style="position: relative; height:80%; width:100%; margin: 1rem;">
                <canvas id="chart" ref={ref} />
            </div>
            <Controls />
        </>
    )
}