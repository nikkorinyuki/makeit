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

    //左上基準(行ごとにyは固定←あとからbaselineを考慮して描画される)
    x: number;
    y: number;

    ascent: number;
    descent: number;

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
        baseFontSize: bestSize,
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
    const MARGIN = 5;
    const positioned: PositionedRun[] = [];

    let x = contentBox.x;
    let y = contentBox.y;
    let line = 1;

    function newline() {
        x = contentBox.x;
        const lineRuns = positioned.filter((p) => p.line === line);
        const maxAscent = Math.max(...lineRuns.map((p) => p.ascent));
        const maxDescent = Math.max(...lineRuns.map((p) => p.descent));
        const height = Math.max(0, maxAscent + maxDescent);
        lineRuns.forEach((p) => {
            p.y += maxAscent;
        });
        y += height; //現在の行の高さ
        y += MARGIN; //MARGIN
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
                ascent: size * 0.9,
                descent: size * 0.1,
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
            const width = measure.width * (fontSize / MAX_FONT);
            const height =
                (measure.actualBoundingBoxAscent +
                    measure.actualBoundingBoxDescent) *
                (fontSize / MAX_FONT);

            if (
                x + width > contentBox.x + contentBox.width &&
                x !== contentBox.x
            ) {
                newline();
            }
            if (part === "\n") {
                newline();
            }

            positioned.push({
                run: {
                    ...run,
                    text: part
                },

                x,
                y,
                ascent: measure.actualBoundingBoxAscent * (fontSize / MAX_FONT),
                descent:
                    measure.actualBoundingBoxDescent * (fontSize / MAX_FONT),
                line,
                width,
                height,

                fontSize
            });

            x += width;
        }
    }

    newline();
    const totalHeight = y - contentBox.y - MARGIN; //最後のMARGINを引く

    const lineWidths = new Map<number, number>();
    for (const p of positioned) {
        lineWidths.set(p.line, (lineWidths.get(p.line) ?? 0) + p.width);
    }
    const width = Math.max(0, ...lineWidths.values());

    // 左右中央揃えにする
    for (let l = 1; l <= line; l++) {
        const lineWidth = lineWidths.get(l)!;
        for (const p of positioned) {
            if (p.line === l) {
                p.x += (width - lineWidth) / 2;
            }
        }
    }

    return {
        runs: positioned,
        width,
        height: totalHeight
    };
}

function splitText(text: string) {
    return [...text];
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

const measureCache = new QuickLRU<string, TextMetrics>({
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

    measureCache.set(key, measure);

    return measure;
}
