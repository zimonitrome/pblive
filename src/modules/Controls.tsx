import { For, createEffect, createSignal, createUniqueId, onMount } from 'solid-js'
import { chart, loadData, onZoom, postsData, setDateRange, zoom } from './MyChart';
import controlStyles from './Controls.module.css';
import { ChartData, ChartDataset, Point } from 'chart.js';

export type ModeType = "hotnesses" | "scores" | "comments" | "active_users" | "subscribers" | "upvote_ratios";
export const getModeTypeTitle = (mode: ModeType) => ({
    hotnesses: "Hotness",
    scores: "Score",
    comments: "Comments",
    active_users: "Active Users",
    subscribers: "Subscribers",
    upvote_ratios: "Upvote Ratio",
}[mode]);
export const [mode, setMode] = createSignal<ModeType>("hotnesses");
export const [filterAuthor, setFilterAuthor] = createSignal<string>('');

export const RadioOption = (props: {
    text: string,
    value: string,
    current: string,
    onChange: (value: string) => void
}) => {
    const id = createUniqueId();
    return <div style={{
        "display": "flex",
        "flex-direction": "row",
        "gap": ".5rem",
    }}>
        <input
            id={id}
            type="radio"
            value={props.value}
            name="options"
            checked={props.current === props.value}
            onChange={() => {
                props.onChange(props.value);
            }}
        />
        <label for={id}>{props.text}</label>
    </div>
};

export const applyFilters = (data: ChartDataset[]) => {
    if (filterAuthor() === "") {
        data.forEach(dataset => {
            dataset.hidden = false;
        });
    }
    else {
        data.forEach(dataset => {
            const datasetAuthor = postsData()[dataset.label!]?.author;

            if (datasetAuthor === filterAuthor()) {
                dataset.hidden = false;
            } else {
                dataset.hidden = true;
            }
        });
    }
};

export const Controls = () => (
    <table class={controlStyles.controlsTable}
    style={{
        // "text-align": "center",
        // "font-size": "1.5rem",
        // "margin": "1rem",
        width: "100%",
        "max-width": "30rem"
    }}>
        <thead>
            <tr>
                <th>Mode</th>
                <th>Zoom to past...</th>
                <th>Filter</th>
                {/* <th>Refresh</th> */}
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>
                    <div style={{"width": "max-content", "margin": "0 auto"}}>
                        {(["hotnesses", "scores", "comments", "active_users", "subscribers", "upvote_ratios"] as ModeType[]).map((value) => (
                            <RadioOption
                                value={value}
                                text={getModeTypeTitle(value)}
                                current={mode()}
                                onChange={(v) => setMode(v as ModeType)}
                            />
                        ))}
                    </div>
                </td>
                <td>
                    <div style={{
                        "display": "flex",
                        "flex-direction": "column",
                        "gap": ".5rem",
                    }}>
                        {([
                            ["hour", 1 * 60 * 60 * 1000],
                            ["day", 24 * 60 * 60 * 1000],
                            ["week", 7 * 24 * 60 * 60 * 1000],
                            ["month", 30 * 24 * 60 * 60 * 1000],
                            ["year", 365 * 24 * 60 * 60 * 1000],
                        ] as [string, number][]).map(([text, time]) => (
                            <button onclick={e => {
                                // const lastTime = Math.max(...data().map(entry => entry.current_times[entry.current_times.length - 1]));
                                const lastTime = (new Date()).getTime();
                                const zoomRange = { min: lastTime - (1.03*time), max: lastTime + (0.03*time) };
                                chart!.zoomScale('x', zoomRange, 'default');
                                chart!.options.plugins!.annotation!.annotations = {
                                    line1: {
                                        type: 'line',
                                        borderWidth: 2,
                                        scaleID: 'x',
                                        value: lastTime-time
                                    },
                                    line2: {
                                        type: 'line',
                                        scaleID: 'x',
                                        value: lastTime
                                    }
                                }
                                chart!.update();
                                setDateRange([zoomRange.min, zoomRange.max]);
                                zoom(chart!);
                                // loadData();
                            }}>{text}</button>
                        ))}
                    </div>
                </td>
                <td>
                    <div style={{
                        "display": "flex",
                        "flex-direction": "column",
                        "gap": ".5rem",
                    }}>
                        <label for="author">Author</label>
                        <input
                            type="text"
                            placeholder='Press "Enter" to apply'
                            value={filterAuthor()}
                            // onInput={e => {
                            //     setFilterAuthor((e.target as HTMLInputElement).value);
                            // }}
                            onKeyDown={e => {
                                if (e.key === "Enter") {
                                    setFilterAuthor((e.target as HTMLInputElement).value);

                                    applyFilters(chart!.data.datasets!);
                                    chart!.update();
                                }
                            }}
                            list="suggestions"
                        />

                        <datalist id="suggestions">
                            <For each={Array.from(new Set(Object.values(postsData()).map(post => post.author))).sort()}>{(author) => (
                                <option value={author} />
                            )}
                            </For>
                        </datalist>
                    </div>
                </td>
                {/* <td style={{
                    // padding: 0,
                    // display: "flex",
                }}>
                    <button style={{
                        width: "100%",
                        height: "3rem",
                        display: "block",
                        "font-size": "2rem",
                    }} onclick={e => {
                        loadData();
                    }}>⟳</button>
                </td> */}
            </tr>
        </tbody>
    </table>
);
