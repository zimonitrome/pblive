import { ChartOptions } from "chart.js";
import { ModeType, mode } from "./Controls";
import { postsData } from "./MyChart";

const intToDate = (value: number | string) => {
    const date = new Date(value);

    // Formatting the day of the week
    const dayOfWeek = date.toLocaleDateString(undefined, { weekday: 'short' });

    // Formatting the time in 24-hour format with no seconds
    const time = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });

    return `${dayOfWeek} ${time}`;
};

function isInSubset<T extends ModeType>(mode: ModeType, subset: T[]): mode is T {
    return subset.includes(mode as T);
}

const options: ChartOptions = {
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
                // title: function (tooltipItems: any) {
                //     return 'Custom Title: ' + tooltipItems[0].label;
                // },
                label: function (context: any) {
                    const datasetLabel = context.dataset.label;
                    const xValue = context.raw.x;
                    const yValue = context.raw.y;

                    const modeString = mode();

                    if ( isInSubset(modeString, ["comments", "scores", "hotnesses", "upvote_ratios"])) {
                        modeString;
                        const id = datasetLabel;
                        const post = (id in postsData()) ? postsData()[id] : undefined;

                        if (!post) {
                            return [id];
                        }

                        const label = [post.title, `by /u/${post.author}`]; //, `[${flair}]`];

                        const suffix = {
                            "hotnesses": " 🔥",
                            "scores": " points",
                            "comments": " comments",
                            "upvote_ratios": "%",
                        }[modeString];

                        return [...label, '', `${Math.round(yValue)}${suffix}`]
                    } else {
                        return [yValue];
                    }
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
                tooltipFormat:'MMM DD HH:mm',
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
};

export default options;