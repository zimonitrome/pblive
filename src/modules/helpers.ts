import { allData } from "./MyChart";

export type URLOptions = {
    from: number;
    to: number;
    column: SubStatsColumn;
}

export type SubStatsAttribute = "active_users" | "subscribers" | "scores" | "ranks" | "comments" | "frontpage_ranks" | "upvote_ratios";
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
    "frontpage_ranks": "I",
    "upvote_ratios": "J"
};

const quantizationFromRange = (from: number, to: number) => {
    const indexColumn = columnToLetter["index"];
    const rangeSeconds = to - from;
    const rangeDays = rangeSeconds / (60 * 60 * 24);
    if (rangeDays < 3) {
        return "";
    }
    else if (rangeDays < (30 * 1.3)) {
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
        columnsToFetch.push("frontpage_ranks");
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

// export const fpRankToColor = (rank: number) => {
//     if (rank < 25) 
//         return "#ffd700";   // Gold
//     if (rank < 50)
//         return "#c0c0c0";   // Silver
//     else
//         return "#cd7f32";   // Bronze
// }

type Color = [number, number, number]; // RGB color

export const interpolateColor = (colorStart: Color, colorEnd: Color, factor: number): Color => {
    return [
        Math.round(colorStart[0] + (colorEnd[0] - colorStart[0]) * factor),
        Math.round(colorStart[1] + (colorEnd[1] - colorStart[1]) * factor),
        Math.round(colorStart[2] + (colorEnd[2] - colorStart[2]) * factor)
    ];
};

const bronzeBottom: Color = [117, 69, 9];
const bronzeTop: Color = [250, 170, 90];
const silverBottom: Color = [140, 140, 140];
const silverTop: Color = [220, 220, 220];
const goldBottom: Color = [255, 180, 0];
const goldTop: Color = [255, 255, 120];

export const fpRankToColor = (rank: number): string => {
    let color: Color;
    if (rank >= 50) {
        // Bronze range
        const factor = (rank - 50) / 49; // Normalizing factor for bronze range
        color = interpolateColor(bronzeTop, bronzeBottom, factor);
    } else if (rank >= 25) {
        // Silver range
        const factor = (rank - 25) / 24; // Normalizing factor for silver range
        color = interpolateColor(silverTop, silverBottom, factor);
    } else {
        // Gold range
        const factor = rank / 24; // Normalizing factor for gold range
        color = interpolateColor(goldTop, goldBottom, factor);
    }
    return `rgba(${color[0]}, ${color[1]}, ${color[2]}, 1)`;
    //   return `rgba(250, 170, 90, 1)`;
};

export const fpRankToEmoji = (rank: number) => {
    if (rank < 25)
        return "🥇";   // Gold
    if (rank < 50)
        return "🥈";   // Silver
    else
        return "🥉";   // Bronze
}

export const fpRankToWidth = (rank: number) => {
    // if (rank < 25) 
    //     return 12;
    // if (rank < 50)
    //     return 9;
    // else
    //     return 12;
    return 9;
}

export const getFpRank = (id: string, dtNum: number, maxHistory: number = 5) => {
    // Function to check if the value is neither undefined nor NaN
    function isValid(value: number | undefined) {
        return value !== undefined && !Number.isNaN(value);
    }

    const initalCheck = allData().frontpage_ranks[dtNum]?.[id];
    if (isValid(initalCheck))
        return initalCheck;

    const frontpageRanks = allData().frontpage_ranks;

    // Get all dtNums sorted in ascending order
    const sortedDtNums = Object.keys(frontpageRanks)
        .map(Number)
        .sort((a, b) => a - b);

    // Find the index of the current dtNum
    const currentIndex = sortedDtNums.indexOf(dtNum);

    // Check for valid rank in the next 5 higher dtNum values
    const hasNextValid = sortedDtNums.slice(currentIndex + 1, currentIndex + 6).some(nextDtNum => {
        const nextRank = frontpageRanks[nextDtNum]?.[id];
        return isValid(nextRank);
    });

    if (!hasNextValid) {
        // If no valid rank is found in the next 5 dtNums, return undefined immediately
        return undefined;
    }

    // If there is a valid rank in the next 5 dtNums, check up to 5 previous dtNums
    for (let i = 1; i <= Math.min(maxHistory, currentIndex); i++) {
        const prevDtNum = sortedDtNums[currentIndex - i];
        const fpRank = frontpageRanks[prevDtNum]?.[id];

        // If a valid fpRank is found, return it
        if (isValid(fpRank)) {
            return fpRank;
        }
    }

    // If no valid fpRank is found within the constraints, return undefined
    return undefined;
}
