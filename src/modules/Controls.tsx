import { createEffect, createSignal, createUniqueId, onMount } from 'solid-js'
import { chart, loadData, onZoom, setDateRange, zoom } from './MyChart';
import controlStyles from './Controls.module.css';

export type ModeType = "hotnesses" | "scores" | "comments" | "active_users" | "subscribers";
export const getModeTypeTitle = (mode: ModeType) => ({
    hotnesses: "Hotness",
    scores: "Score",
    comments: "Comments",
    active_users: "Active Users",
    subscribers: "Subscribers",
}[mode]);
export const [mode, setMode] = createSignal<ModeType>("hotnesses");

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

export const Controls = () => (
    <table class={controlStyles.controlsTable}
    style={{
        "text-align": "center",
        // "font-size": "1.5rem",
        // "margin": "1rem",
        width: "100%",
        "max-width": "30rem"
    }}>
        <thead>
            <tr>
                <th>Mode</th>
                <th>Timespan</th>
                {/* <th>Refresh</th> */}
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>
                    <div style={{"width": "max-content", "margin": "0 auto"}}>
                        {(["hotnesses", "scores", "comments", "active_users", "subscribers"] as ModeType[]).map((value) => (
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
                        {([["1 hour", 1 * 60 * 60 * 1000], ["24 hours", 24 * 60 * 60 * 1000], ["1 week", 7 * 24 * 60 * 60 * 1000]] as [string, number][]).map(([text, time]) => (
                            <button onclick={e => {
                                // const lastTime = Math.max(...data().map(entry => entry.current_times[entry.current_times.length - 1]));
                                const lastTime = (new Date()).getTime();
                                const zoomRange = { min: lastTime - (1.1*time), max: lastTime + (0.1*time) };
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
