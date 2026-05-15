import QuickLRU from "quick-lru";
import { CanvasRenderingContext2D } from "skia-canvas";
import { MAX_FONT, MIN_FONT } from "./conts";
import { Font, getBestFont } from "./fonts";
import { resolveStyle } from "./style";
import { Run, TextStyle } from "./type";

type ContentBox = {
    x: number;
    y: number;
    width: number;
    height: number;
};

type PositionedRun = {
    run: Run;

    x: number;
    y: number;
    line: number;
    width: number;
    height: number;

    fontSize: number;
};

export type LayoutResult = {
    runs: PositionedRun[];
    width: number;
    height: number;
};

/* =========================================================
   FONT SEARCH
========================================================= */

export function findBestFontSize(
    ctx: CanvasRenderingContext2D,
    runs: Run[],
    defaultTextStyle: Partial<TextStyle>,
    fontFamilies: string[],
    contentBox: ContentBox,
    minFontSize = MIN_FONT,
    maxFontSize = MAX_FONT
) {
    let low = minFontSize;
    let high = maxFontSize;

    let bestSize = minFontSize;
    let bestLayout: LayoutResult | null = null;

    while (low <= high) {
        const mid = (low + high) >> 1;

        const layout = layoutRuns(
            ctx,
            runs,
            mid,
            defaultTextStyle,
            fontFamilies,
            contentBox
        );

        console.log(low, high, JSON.stringify(layout));
        if (
            layout.height <= contentBox.height &&
            layout.width <= contentBox.width
        ) {
            bestSize = mid;
            bestLayout = layout;

            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }

    return {
        fontSize: bestSize,
        layout: bestLayout!
    };
}

/* =========================================================
   LAYOUT
========================================================= */

function layoutRuns(
    ctx: CanvasRenderingContext2D,
    runs: Run[],
    baseFontSize: number,
    defaultTextStyle: Partial<TextStyle>,
    fontFamilies: string[],
    contentBox: ContentBox
): LayoutResult {
    const positioned: PositionedRun[] = [];

    let x = contentBox.x;
    let y = contentBox.y;
    let line = 1;

    function newline() {
        x = contentBox.x;
        y += Math.max(
            ...positioned.filter((p) => p.line == line).map((p) => p.height)
        ); //現在の行の最大高さを取得する
        y += 5; //MARGIN
        line++;
    }

    for (const run of runs) {
        const style = resolveStyle(run.style, defaultTextStyle);

        const fontSize = getEffectiveFontSize(style, baseFontSize);

        const maxFont = Font.getCanvasFont(style, fontFamilies, MAX_FONT);

        if (run.type === "emoji") {
            const size = fontSize;

            if (x + size > contentBox.x + contentBox.width) {
                newline();
            }

            positioned.push({
                run,

                x,
                y,
                line,
                width: size,
                height: size,

                fontSize
            });

            x += size;

            continue;
        }

        const parts = splitText(run.text);

        for (const part of parts) {
            const measure = measureTextCached(ctx, part, maxFont);
            const width = measure[0] * (fontSize / MAX_FONT);
            const height = measure[1] * (fontSize / MAX_FONT);

            if (
                x + width > contentBox.x + contentBox.width &&
                x !== contentBox.x
            ) {
                newline();
            }

            positioned.push({
                run: {
                    ...run,
                    text: part
                },

                x,
                y,
                line,
                width,
                height,

                fontSize
            });

            x += width;
        }
    }

    newline();
    const totalHeight = y - contentBox.y;

    const lineWidths = new Map<number, number>();
    for (const p of positioned) {
        lineWidths.set(p.line, (lineWidths.get(p.line) ?? 0) + p.width);
    }

    return {
        runs: positioned,
        width: Math.max(0, ...lineWidths.values()),
        height: totalHeight
    };
}

function splitText(text: string) {
    return text.match(/\S+|\s+|./gu) ?? [];
}

function getEffectiveFontSize(
    style: Required<TextStyle>,
    baseFontSize: number
) {
    return Math.round(baseFontSize * style.scale);
}

/* =========================================================
   MEASURE
========================================================= */

const measureCache = new QuickLRU<string, [number, number]>({
    maxSize: 50000
});

function measureTextCached(
    ctx: CanvasRenderingContext2D,
    text: string,
    font: Font
) {
    const fontData = font.toJSON();
    const { fontname } = getBestFont(text, fontData.family);
    const key = `${fontData.weight}_${fontname}_${text}`;

    const cached = measureCache.get(key);

    if (cached != null) {
        return cached;
    }

    ctx.font = font.toString();

    const measure = ctx.measureText(text);
    const width = measure.width;
    const height =
        measure.actualBoundingBoxAscent + measure.actualBoundingBoxDescent;

    measureCache.set(key, [width, height]);

    return [width, height];
}
