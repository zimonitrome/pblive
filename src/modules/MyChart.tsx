import { Show, createEffect, createSignal, on, onMount } from 'solid-js'
import { Chart, ChartDataset, DefaultDataPoint, Point, registerables } from 'chart.js'
import 'chartjs-adapter-moment';
import { Controls, applyFilters, filterAuthor, getModeTypeTitle, mode } from './Controls';
import { SubStatsAttribute, SubStatsColumn, URLOptions, calculateHotness, debounce, getPostsURL, getSubStatURL, stringToColorHash } from './helpers';
import zoomPlugin from 'chartjs-plugin-zoom';
import annotationPlugin from 'chartjs-plugin-annotation';
import chartOptions from './chartOptions';
import Spinner from './Spinner';

type DateNumDict = { [dt: number]: number };
type DateSeriesDict = {
    [dt: number]: {
        ids: string[];
        values: number[];
    }
};
type DataStruct = {
    active_users: DateNumDict;
    subscribers: DateNumDict;
    scores: DateSeriesDict
    ranks: DateSeriesDict
    comments: DateSeriesDict
    hotness: DateSeriesDict
    upvote_ratios: DateSeriesDict
};

type PostsStruct = {
    [id: string]: {
        author: string;
        flair: string;
        post_time: number;
        title: string;
    }
};

export const [allData, setAllData] = createSignal<DataStruct>({
    active_users: {},
    subscribers: {},
    scores: {},
    ranks: {},
    comments: {},
    hotness: {},
    upvote_ratios: {},
});
export const [postsData, setPostsData] = createSignal<PostsStruct>({});

export const [chartData, setChartData] = createSignal<[]>([]);
export const [dateRange, setDateRange] = createSignal<[number, number]>([
    (new Date().getTime()) / 1000 - (2 * 60 * 60 * 24),
    (new Date().getTime()) / 1000
]);
const [columnToLoad, setColumnToLoad] = createSignal<Partial<SubStatsAttribute>>(
    (mode() === "hotnesses" ? "scores" : mode()) as Partial<SubStatsAttribute>
);
const [isLoading, setIsLoading] = createSignal<boolean>(false);

export const loadData = async () => {    
    // return;

    // TODO: check if data in range is already loaded
    setIsLoading(true);

    try {
        // Fetch data
        const url = getSubStatURL({
            from: dateRange()[0],
            to: dateRange()[1],
            column: columnToLoad(),
        });
        const response = await fetch(url);

        let data = await response.text();
        data = data.replaceAll('"', '');
        // const nLines = data.split("\n").length;

        // Parse data
        let newData: DateNumDict | DateSeriesDict = {};

        if (["active_users", "subscribers"].includes(columnToLoad())) {
            data.split("\n").slice(1).forEach((line) => {
                const [dt, value] = line.split(",");
                if (!value) {
                    return;
                }
                newData[parseInt(dt)] = parseInt(value);
            });
        }
        else {
            data.split("\n").slice(1).forEach((line) => {
                const [dt, ids, values] = line.split(",");
                if (!ids || !values) {
                    return;
                }
                newData[parseInt(dt)] = {
                    ids: ids.split(";"),
                    values: values.split(";").map((v: string) => parseFloat(v))
                }
            });
        }

        setAllData((prev) => ({ ...prev, [columnToLoad()]: newData }));

    } catch (error) {
        console.error('Error loading data:', error);
    }


    try {
        // Fetch data
        const url = getPostsURL(
            dateRange()[0] - (5 * 60 * 60 * 24), // Load with a five days marginal (maybe more?)
            dateRange()[1]
        );
        const response = await fetch(url);

        let data = await response.text();
        // const nLines = data.split("\n").length;

        // Parse data
        let newData: PostsStruct = {};

        data.split("\n").slice(1).forEach((line) => {
            const [id, author, flair, post_time, title] = line.split(",").map((v) => v.slice(1,-1));
            newData[id] = {
                author,
                flair,
                post_time: parseInt(post_time),
                title
            };

            // Add the post times to the chart data
            setAllData((prev) => {
                prev.scores[parseInt(post_time)] = {
                    ids: [id],
                    values: [0]
                };
                prev.comments[parseInt(post_time)] = {
                    ids: [id],
                    values: [0]
                };
                prev.hotness[parseInt(post_time)] = {
                    ids: [id],
                    values: [0]
                };
                prev.upvote_ratios[parseInt(post_time)] = {
                    ids: [id],
                    values: [1.00]
                };
                return prev;
            });
        });

        setPostsData((prev) => ({ ...prev, ...newData }));

    } catch (error) {
        console.error('Error loading data:', error);
    }



    reloadChart();
};

export const reloadChart = () => {
    if (chart) {
        // Change title correctly
        if ((chart.options.scales as any).y.title.text !== getModeTypeTitle(mode())) {
            (chart.options.scales as any).y.title.text = getModeTypeTitle(mode());
            chart.data.datasets = [];
        }

        let newDatasets: ChartDataset<"line", DefaultDataPoint<"line">>[] = [];

        const columnData = allData()[columnToLoad()];
        if (["active_users", "subscribers"].includes(columnToLoad())) {
            const dataPoints = Object.entries(columnData as DateNumDict).map(([dt, value]) => ({
                x: 1000 * parseInt(dt),
                y: value
            }));

            newDatasets.push({
                label: getModeTypeTitle(mode()),
                data: dataPoints,
                showLine: true,
                pointRadius: 0,
                borderJoinStyle: 'bevel',
            });
        } else {
            
            let posts: { [id: string]: { x: number, y: number }[] } = {};

            // Object.values(columnData as DateSeriesDict).forEach(({ids, values}) => {
            Object.entries(columnData as DateSeriesDict).forEach(([dt, { ids, values }]) => {
                ids.forEach((id, index) => {
                    if (!posts[id]) {
                        posts[id] = [];
                    }
                    let x = 1000 * parseInt(dt);
                    let y = values[index];

                    if (mode() === "hotnesses") {
                        // Special case for hotnesses, need to apply function
                        if (!postsData()[id]) {
                            return;
                        }
                        y = calculateHotness(x, 1000*postsData()[id].post_time, y);
                    }
                    if (mode() === "upvote_ratios") {
                        // Special case for upvote_ratios, mulitply by 100
                        if (!postsData()[id]) {
                            return;
                        }
                        y *= 100;
                    }

                    posts[id].push({x, y});
                });
            });

            // // TODO: Re-calcluate hotness here.
            // if (mode() === "hotnesses") {
            //     const hotnesses = Object.entries(posts).map(([id, data]) => {
            //         let hotness = 0;
            //         data.forEach((point) => {
            //             hotness += point.y;
            //         });
            //         return [id, hotness] as [string, number];
            //     });
            //     hotnesses.sort((a, b) => b[1] - a[1]);
            //     hotnesses.slice(0, 10).forEach(([id, hotness]) => {
            //         newDatasets.push({
            //             label: id,
            //             data: posts[id],
            //             showLine: true,
            //             pointRadius: 0,
            //             borderJoinStyle: 'bevel',
            //         });
            //     });
            // }

            Object.entries(posts).forEach(([id, data]) => {
                let color: string;
                let label: string;
                const post = (id in postsData()) ? postsData()[id] : undefined;
                if (post !== undefined) {
                    color = stringToColorHash(post.author);
                    label = id;
                } else {
                    color = stringToColorHash(id);
                    label = id;
                }

                newDatasets.push({
                    label: label,
                    data: data,
                    showLine: true,
                    borderJoinStyle: 'bevel',
                    borderDash: post?.flair === "legacy comic" ? [10,5] : [],
                    // Colors
                    borderColor: color,
                    backgroundColor: color,
                    pointBackgroundColor: color,
                    pointBorderColor: color,
                    pointHoverBackgroundColor: color,
                    pointHoverBorderColor: color,
                });
            });
        }

        for (const dataset of newDatasets) {
            // Find dataset with same label in chart.data.datasets
            const existingDataset = chart.data.datasets!.find((d) => d.label === dataset.label);
            if (existingDataset === undefined) {
                chart.data.datasets!.push(dataset);
            } else {
                // existingDataset.data = dataset.data;
                const newPoints = (dataset.data as Point[]).filter(bItem => !(existingDataset.data as Point[]).some(aItem => aItem.x === bItem.x));
                // existingDataset.data = [...existingDataset.data, ...newPoints];
                newPoints.forEach(bItem => {
                    // Find the index at which to insert bItem in A
                    const insertAt = (existingDataset.data as Point[]).findIndex(aItem => aItem.x > bItem.x);
                    // If bItem.x is greater than any x in A, append it; otherwise, insert it at the found index
                    if (insertAt === -1) {
                        existingDataset.data.push(bItem);
                    } else {
                        existingDataset.data.splice(insertAt, 0, bItem);
                    }
                });
            }
        }

        // Make first point bigger as to indicate when the post was made
        for (let dataset of (chart.data.datasets as ChartDataset<"line", (number | Point | null)[]>[])) {
            const pointRadius = new Array(dataset.data.length).fill(0);
            pointRadius[0] = 7;
            dataset.pointRadius = pointRadius;
        }

        // Apply filters
        applyFilters(chart.data.datasets!);

        chart!.update();

        chart.update();
        setIsLoading(false);
    }
}


export let chart: Chart | undefined = undefined;
// export const [chart, setChart] = createSignal<Chart>();

export const zoom = (chart: Chart) => {
    let xAxis = chart.scales.x;
    let start = Math.round(xAxis.min / 1000);
    let end = Math.round(xAxis.max / 1000);
    setDateRange([start, end] as [number, number]);
    loadData();
}

// Debounce zoom to not load too quickly
export const onZoom = debounce((context: { chart: Chart }) => {
    zoom(context.chart);
}, 1000); // 1000 milliseconds = 1 second

export const MyChart2 = () => {
    /**
     * You must register optional elements before using the chart,
     * otherwise you will have the most primitive UI
     */

    let ref: HTMLCanvasElement | undefined = undefined;

    // let datasets: ChartDataset[];
    // if (mode() in ["active_users", "subscribers"]) {
    //     datasets = [{
    //         data: Object.values(chartData())
    //     }]
    // }
    // else {
    //     datasets = Object.values(chartData()).map((value) => ({
    //         data: Object.values(value)
    //     }));
    // }


    onMount(async () => {
        Chart.register(...registerables, zoomPlugin, annotationPlugin);
        chart = new Chart(ref!, {
            type: "line",
            data: {
                labels: Object.keys(chartData()),
                datasets: []
            },
            options: chartOptions
        });

        chart.options.plugins!.zoom!.zoom!.onZoomComplete = onZoom;
        chart.options.plugins!.zoom!.pan!.onPanComplete = onZoom;

        // Set initial x-axis range to the date range
        chart.options.scales!.x!.min = dateRange()[0] * 1000;
        chart.options.scales!.x!.max = dateRange()[1] * 1000;
    });

    createEffect(() => {
        setColumnToLoad((mode() === "hotnesses" ? "scores" : mode()) as Partial<SubStatsAttribute>);
    });

    createEffect(on(mode, loadData));


    return (
        <>
            <div class="chart-container" style="position: relative; height:80%; width:100%;">
                <canvas id="chart" ref={ref} />
                <Show when={isLoading()}>
                    <Spinner />
                </Show>
            </div>
            <Controls />
        </>
    )
}