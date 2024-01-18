import { createEffect, createSignal, createUniqueId, onMount } from 'solid-js'
import { chart, data } from './MyChart';

export type ModeType = "hotnesses" | "scores" | "comments";
export const getModeTypeTitle = (mode: ModeType) => ({
    hotnesses: "Hotness",
    scores: "Score",
    comments: "Comments",
}[mode]);
export const [mode, setMode] = createSignal<ModeType>("hotnesses");

// export type TimeSpanType = "hotnesses" | "scores" | "comments";
// export const [timespan, setTimespan] = createSignal<ModeType>("hotnesses");

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
    <table style={{
        "text-align": "center",
        "font-size": "1.5rem",
        "margin": "1rem",
    }}>
        <thead>
            <tr>
                <th>Mode</th>
                <th>Timespan</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>
                    {(["hotnesses", "scores", "comments"] as ModeType[]).map((value) => (
                        <RadioOption
                            value={value}
                            text={getModeTypeTitle(value)}
                            current={mode()}
                            onChange={(v) => setMode(v as ModeType)}
                        />
                    ))}
                </td>
                <td>
                    <div style={{
                        "display": "flex",
                        "flex-direction": "column",
                        "gap": ".5rem",
                    }}>
                        {([["1 hour", 1 * 60 * 60 * 1000], ["24 hours", 24 * 60 * 60 * 1000], ["1 week", 7 * 24 * 60 * 60 * 1000]] as [string, number][]).map(([text, time]) => (
                            <button onclick={e => {
                                const lastTime = Math.max(...data().map(entry => entry.current_times[entry.current_times.length - 1]));
                                chart!.zoomScale('x', { min: lastTime - (1.1*time), max: lastTime + (0.1*time) }, 'default');
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
                            }}>{text}</button>
                        ))}
                    </div>
                </td>
            </tr>
        </tbody>
    </table>
);
