export type URLOptions = {
    from: number;
    to: number;
    column: SubStatsColumn;
}

export type SubStatsAttribute = "active_users" | "subscribers" | "scores" | "ranks" | "comments" | "upvote_ratios";
export type SubStatsColumn = "index" | "current_time" | "ids" | SubStatsAttribute;
const columnToLetter: Record<SubStatsColumn, string> = {
    "index": "A",
    "current_time": "B",
    "active_users": "C",
    "subscribers": "D",
    "ids": "E",
    "scores": "F",
    "ranks": "G",
    "comments": "H",
    "upvote_ratios": "J"
};

const quantizationFromRange = (from: number, to: number) => {
    const indexColumn = columnToLetter["index"];
    const rangeSeconds = to - from;
    const rangeDays = rangeSeconds / (60 * 60 * 24);
    if (rangeDays < 3) {
        return "";
    }
    else if (rangeDays < (30*1.3)) {
        return `and ${indexColumn} ends with "0"`;
    }
    else {
        return `and ${indexColumn} ends with "00"`;
    }
}

// Base URL of the Google Sheet
const sheetBaseUrl = "https://docs.google.com/spreadsheets/d/1XbSqIH7CzYTgKkjVmGP3FFPHs1sqM3D3aj7O4lFPfn0/gviz/tq?";

export const getSubStatURL = ({ from, to, column }: URLOptions) => {
    // Query parameters
    const sheetName = "sub_stats";
    const columnsToFetch: SubStatsColumn[] = ["current_time"];
    if (!["active_users", "subscribers"].includes(column)) {
        columnsToFetch.push("ids");
    }
    columnsToFetch.push(column);
    const columnsToFetchLetters = columnsToFetch.map((column) => columnToLetter[column]);
    const quantizationTerm = quantizationFromRange(from, to);
    const query = `select ${columnsToFetchLetters.join()} where (B >= ${from} and B <= ${to} ${quantizationTerm})`;

    // Encoding the query
    const encodedQuery = encodeURIComponent(query);

    // Constructing the full URL
    return `${sheetBaseUrl}tqx=out:csv&sheet=${sheetName}&tq=${encodedQuery}`;
};

export const getPostsURL = (from: number, to: number) => {
    // Query parameters
    const sheetName = "posts";

    // D column is post_time
    const query = `select * where (D >= ${from} and D <= ${to})`;

    // Encoding the query
    const encodedQuery = encodeURIComponent(query);

    // Constructing the full URL
    return `${sheetBaseUrl}tqx=out:csv&sheet=${sheetName}&tq=${encodedQuery}`;
};

export const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
    let timeout: number | undefined = undefined;

    return function (...args: Parameters<F>) {
        if (timeout !== undefined) {
            clearTimeout(timeout);
        }
        timeout = window.setTimeout(() => func(...args), waitFor) as unknown as number;
    };
};

export const stringToColorHash = (inputString: string): string => {
    // Create a hash from the input string
    const hash = Array.from(inputString).reduce((hash, char) => {
        return char.charCodeAt(0) + ((hash << 5) - hash);
    }, 0);

    // Convert hash to more vibrant L, a, b values
    const L = 40 + (Math.abs(hash) % 61); // Lightness starts at 40, up to 100 for increased brightness
    // Increase the range for a* and b* to make colors more vibrant
    const a = -100 + (Math.abs(hash * 2) % 201); // -100 to 100 for more vibrant green to red
    const b = -100 + (Math.abs(hash * 3) % 201); // -100 to 100 for more vibrant blue to yellow

    // Return Lab color as a string suitable for CSS
    return `lab(${L}% ${a} ${b})`;
};

const decay_constant = 5.1966223406838415e-08;
export const calculateHotness = (currentTime: number, postTime: number, score: number) => {
    const timeSincePosted = currentTime - postTime;
    return score * Math.exp(-decay_constant * timeSincePosted);
}
