import { readFileSync } from "fs";
import {
    Canvas,
    CanvasRenderingContext2D,
    ExportFormat,
    Image
} from "skia-canvas";
import {
    CIRCLE_RADIUS,
    GOLDEN_RADIO,
    HEIGHT,
    MARGIN,
    MAX_FONT,
    MAX_TEXT_WIDTH,
    TEXT_MARGIN,
    WIDTH
} from "./conts";
import { emojiMap } from "./emoji";
import { Font } from "./fonts";
import { findBestFontSize, LayoutResult } from "./fontsize";
import { markdownToRuns, textToRuns } from "./runs";
import { resolveStyle } from "./style";

type DebugMetric = {
    label: string;
    ms: number;
};

function nowMs() {
    return performance.now();
}

function pushMetric(metrics: DebugMetric[] | null, label: string, start: number) {
    if (!metrics) return;
    metrics.push({ label, ms: nowMs() - start });
}

function drawDebugTimings(ctx: CanvasRenderingContext2D, metrics: DebugMetric[]) {
    if (metrics.length === 0) return;

    const lines = metrics.map(
        (metric) => `${metric.label.padEnd(16, " ")}: ${metric.ms.toFixed(2)} ms`
    );

    ctx.save();
    ctx.font = "14px NotoSansJP-Medium";
    ctx.textBaseline = "top";

    const startX = 10;
    const startY = 10;
    const paddingX = 8;
    const paddingY = 4;
    const lineHeight = 18;

    const maxOverlayHeight = HEIGHT - startY * 2;
    const rowsPerColumn = Math.max(
        1,
        Math.floor((maxOverlayHeight - paddingY * 2) / lineHeight)
    );

    const columns: string[][] = [];
    for (let i = 0; i < lines.length; i += rowsPerColumn) {
        columns.push(lines.slice(i, i + rowsPerColumn));
    }

    const columnWidths = columns.map((column) =>
        column.reduce((max, line) => Math.max(max, ctx.measureText(line).width), 0)
    );

    const columnGap = 12;
    const boxWidth =
        columnWidths.reduce((sum, width) => sum + width + paddingX * 2, 0) +
        columnGap * Math.max(0, columns.length - 1);
    const maxColumnRows = Math.max(...columns.map((column) => column.length));
    const boxHeight = maxColumnRows * lineHeight + paddingY * 2;

    ctx.fillStyle = "rgba(0, 0, 0, 0.72)";
    ctx.fillRect(startX, startY, boxWidth, boxHeight);

    ctx.fillStyle = "#6CFF8F";
    let currentX = startX;
    columns.forEach((column, columnIndex) => {
        const textX = currentX + paddingX;
        column.forEach((line, rowIndex) => {
            ctx.fillText(line, textX, startY + paddingY + lineHeight * rowIndex);
        });
        currentX += columnWidths[columnIndex] + paddingX * 2 + columnGap;
    });

    ctx.restore();
}

export async function render(
    {
        text = "Text",
        icon,
        name = "name",
        id = "id",
        debug = false,
        markdown = true,
        direction = "left",
        color,
        tcolor,
        format
    }: {
        text: string;
        icon?: string;
        name: string;
        id: string;
        debug: boolean;
        markdown: boolean;
        direction: `left` | `right`;
        color: string;
        tcolor?: string;
        format: ExportFormat;
    },
    signal?: AbortSignal
) {
    const renderStart = nowMs();
    const debugMetrics: DebugMetric[] | null = debug ? [] : null;

    const canvas = new Canvas(WIDTH, HEIGHT);

    const ctx = canvas.getContext("2d");

    /*
    background
  */

    const backgroundStart = nowMs();
    await drawBackground(ctx, direction, color, icon);
    pushMetric(debugMetrics, "background", backgroundStart);

    /*
    parse
    */

    const parseStart = nowMs();
    const name_runs = textToRuns(name);
    const id_runs = textToRuns(id);
    const nky_runs = textToRuns("Powered by nikkorinyuki/makeit");
    const text_runs = markdown ? markdownToRuns(text) : textToRuns(text);
    pushMetric(debugMetrics, "parse", parseStart);

    /*
    font 
    */

    const name_font = [
        "NotoSansCanadianAboriginal-Bold",
        "NotoSansJP-Medium",
        "NotoSansKR-Medium",
        "NotoSansSC-Medium",
        "NotoSansMath-Regular"
    ];
    const id_font = [
        "NotoSansCanadianAboriginal-Bold",
        "NotoSansJP-Medium",
        "NotoSansKR-Medium",
        "NotoSansSC-Medium",
        "NotoSansMath-Regular"
    ];
    const nky_font = ["NotoSansJP-Medium"];
    const text_font = [
        "SourGummy-Regular",
        "PopGothicCjkJp-Bold",
        "NotoSansCanadianAboriginal-Bold",
        "NotoSansJP-Medium",
        "NotoSansKR-Medium",
        "NotoSansSC-Medium",
        "NotoSansMath-Regular"
    ];

    /*
    auto fit
    */

    const nameFitStart = nowMs();
    const { layout: name_layout } = findBestFontSize(
        ctx,
        name_runs,
        {},
        name_font,
        { x: 0, y: 0, width: MAX_TEXT_WIDTH, height: HEIGHT }, //仮置き
        30,
        30,
        signal
    );
    pushMetric(debugMetrics, "fit:name", nameFitStart);

    const idFitStart = nowMs();
    const { layout: id_layout } = findBestFontSize(
        ctx,
        id_runs,
        {},
        id_font,
        { x: 0, y: 0, width: MAX_TEXT_WIDTH, height: HEIGHT }, //仮置き
        30,
        30,
        signal
    );
    pushMetric(debugMetrics, "fit:id", idFitStart);

    const nkyFitStart = nowMs();
    const { layout: nky_layout } = findBestFontSize(
        ctx,
        nky_runs,
        {},
        nky_font,
        { x: 0, y: 0, width: MAX_TEXT_WIDTH, height: HEIGHT }, //仮置き
        10,
        10,
        signal
    );
    pushMetric(debugMetrics, "fit:credit", nkyFitStart);

    const textFitStart = nowMs();
    const { layout: text_layout } = findBestFontSize(
        ctx,
        text_runs,
        {},
        text_font,
        {
            x: 0,
            y: 0,
            width: MAX_TEXT_WIDTH,
            height:
                HEIGHT - name_layout.height - id_layout.height - TEXT_MARGIN * 2
        },
        undefined,
        undefined,
        signal
    );
    pushMetric(debugMetrics, "fit:text", textFitStart);

    /*
    render
    */

    //TODO:layoutがないとき(適切なサイズが見つからなかったとき)の対処を導入する
    const totalHeight =
        text_layout.height +
        name_layout.height +
        id_layout.height +
        2 * TEXT_MARGIN;
    const text_y = (HEIGHT - totalHeight) / 2;
    const name_y = text_y + text_layout.height + TEXT_MARGIN;
    const id_y = name_y + name_layout.height + TEXT_MARGIN;

    const drawTextMainStart = nowMs();
    await drawText(
        ctx,
        text_layout,
        text_font,
        {
            x:
                direction === "left"
                    ? (MARGIN + MAX_TEXT_WIDTH - text_layout.width) / 2 +
                      CIRCLE_RADIUS
                    : (MARGIN + MAX_TEXT_WIDTH - text_layout.width) / 2,
            y: text_y
        },
        tcolor,
        debug,
        debugMetrics,
        "main"
    );
    pushMetric(debugMetrics, "draw:text", drawTextMainStart);

    const drawNameStart = nowMs();
    await drawText(
        ctx,
        name_layout,
        name_font,
        {
            x:
                direction === "left"
                    ? (MARGIN + MAX_TEXT_WIDTH - name_layout.width) / 2 +
                      CIRCLE_RADIUS
                    : (MARGIN + MAX_TEXT_WIDTH - name_layout.width) / 2,
            y: name_y
        },
        tcolor,
        debug,
        debugMetrics,
        "name"
    );
    pushMetric(debugMetrics, "draw:name", drawNameStart);

    const drawIdStart = nowMs();
    await drawText(
        ctx,
        id_layout,
        id_font,
        {
            x:
                direction === "left"
                    ? (MARGIN + MAX_TEXT_WIDTH - id_layout.width) / 2 +
                      CIRCLE_RADIUS
                    : (MARGIN + MAX_TEXT_WIDTH - id_layout.width) / 2,
            y: id_y
        },
        "#8F8F8F",
        debug,
        debugMetrics,
        "id"
    );
    pushMetric(debugMetrics, "draw:id", drawIdStart);

    const drawCreditStart = nowMs();
    await drawText(
        ctx,
        nky_layout,
        nky_font,
        {
            x: direction === "left" ? WIDTH - nky_layout.width - 5 : 5,
            y: HEIGHT - nky_layout.height
        },
        "#8F8F8F",
        debug,
        debugMetrics,
        "credit"
    );
    pushMetric(debugMetrics, "draw:credit", drawCreditStart);

    if (debugMetrics) {
        debugMetrics.push({ label: "total", ms: nowMs() - renderStart });
        drawDebugTimings(ctx, debugMetrics);
    }

    return await canvas.toBuffer(format);
}

async function drawBackground(
    ctx: CanvasRenderingContext2D,
    direction: `left` | `right` = `left`,
    color: string = "white",
    iconURL?: string
) {
    const image = new Image();
    image.src = iconURL || "./assets/dummy_icon.png";
    await image.decode();

    const x = direction == "right" ? WIDTH + CIRCLE_RADIUS : -CIRCLE_RADIUS;
    const y = HEIGHT * (3 / 4);
    const iconPositionX =
        direction == "right"
            ? WIDTH * (GOLDEN_RADIO / (1 + GOLDEN_RADIO))
            : WIDTH * (1 / (1 + GOLDEN_RADIO)) - HEIGHT;

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.drawImage(image, iconPositionX, 0, HEIGHT, HEIGHT);

    const gradient = ctx.createRadialGradient(
        x,
        y,
        CIRCLE_RADIUS * 1,
        x,
        y,
        CIRCLE_RADIUS * 2.5
    );

    gradient.addColorStop(0.0, colorToRGBA(ctx, color, 0));
    gradient.addColorStop(0.8 * (2 / 3), colorToRGBA(ctx, color, 0));
    gradient.addColorStop(1.0 * (2 / 3), colorToRGBA(ctx, color, 1));
    gradient.addColorStop(1.0, colorToRGBA(ctx, color, 1));

    ctx.fillStyle = gradient;

    ctx.beginPath();
    ctx.arc(x, y, CIRCLE_RADIUS * 3, 0, Math.PI * 2);
    ctx.fill();
}

async function drawText(
    ctx: CanvasRenderingContext2D,
    layout: LayoutResult,
    fontFamilies: string[],
    offset: { x: number; y: number },
    color?: string,
    debug = false,
    debugMetrics: DebugMetric[] | null = null,
    metricLabel = "text"
) {
    const drawTextStart = nowMs();
    let lineLayoutMs = 0;
    let styleAndFontMs = 0;
    let textDrawMs = 0;
    let emojiDrawMs = 0;
    let decorationMs = 0;
    let debugGuideMs = 0;

    const lines = layout.runs.map((r) => r.line);
    const uniqueLines = Array.from(new Set(lines));
    const lineSizes: { x: number; y: number; width: number; height: number }[] =
        [];
    //debug時のみwidthは計算される

    for (const line of uniqueLines) {
        const lineLayoutStart = nowMs();
        const lineRuns = layout.runs.filter((r) => r.line === line);
        const minX = Math.min(...lineRuns.map((r) => r.x));
        const maxX = debug
            ? Math.max(...lineRuns.map((r) => r.x + r.width))
            : 0;
        const maxAscent = Math.max(...lineRuns.map((p) => p.ascent));
        const maxDescent = Math.max(...lineRuns.map((p) => p.descent));
        const height = Math.max(0, maxAscent + maxDescent);
        lineSizes[line] = {
            x: minX,
            y: lineRuns[0].y - maxAscent,
            width: maxX - minX,
            height
        };
        if (debug) {
            lineLayoutMs += nowMs() - lineLayoutStart;
        }
    }

    for (const positioned of layout.runs) {
        const styleStart = debug ? nowMs() : 0;
        const run = positioned.run;

        const style = resolveStyle(run.style, {});

        ctx.font = Font.getCanvasFont(
            style,
            fontFamilies,
            positioned.fontSize
        ).toString();
        if (debug) {
            styleAndFontMs += nowMs() - styleStart;
        }

        ctx.textBaseline = "alphabetic";

        /*
            code bg
        */

        if (style.code) {
            const decoStart = debug ? nowMs() : 0;
            ctx.fillStyle = "#1e1e1e8e";

            ctx.fillRect(
                positioned.x + offset.x,

                lineSizes[positioned.line].y + offset.y,

                positioned.width,

                lineSizes[positioned.line].height
            );
            if (debug) {
                decorationMs += nowMs() - decoStart;
            }
        }

        /*
            quote line
        */

        if (style.quote && positioned.x === lineSizes[positioned.line].x) {
            const decoStart = debug ? nowMs() : 0;
            ctx.fillStyle = "#1e1e1e";

            ctx.fillRect(
                positioned.x - 3 + offset.x,
                lineSizes[positioned.line].y + offset.y,

                5,
                lineSizes[positioned.line].height
            );
            if (debug) {
                decorationMs += nowMs() - decoStart;
            }
        }

        /*
            text
        */

        if (style.italic) {
            // 斜体はtransformで傾けて表現する
            // 斜体の基準位置に移動してから傾ける
            // 絵文字を曲げるべきかは要検討
            ctx.save();
            ctx.translate(positioned.x + offset.x, positioned.y + offset.y);
            ctx.transform(1, 0, Math.tan((-15 * Math.PI) / 180), 1, 0, 0);
        }
        if (run.type === "emoji") {
            const emojiStart = debug ? nowMs() : 0;
            const image = await getEmojiImage(run.emoji);

            if (image) {
                ctx.drawImage(
                    image,

                    style.italic ? 0 : positioned.x + offset.x,

                    style.italic
                        ? -positioned.ascent
                        : positioned.y + offset.y - positioned.ascent, //絵文字のbaselineはtopなのでyからascentを引く

                    positioned.width,
                    positioned.height
                );
            }
            if (debug) {
                emojiDrawMs += nowMs() - emojiStart;
            }
        } else {
            const textStart = debug ? nowMs() : 0;
            ctx.fillStyle = style.color ?? color ?? "#000";

            if (style.bold) {
                //太字は同じテキストの縁を描画して表現する
                ctx.lineWidth = 2 * (positioned.fontSize / MAX_FONT);
                ctx.strokeStyle = ctx.fillStyle.toString();
                ctx.strokeText(
                    run.text,
                    style.italic ? 0 : positioned.x + offset.x,
                    style.italic ? 0 : positioned.y + offset.y
                );
            }

            ctx.textBaseline = "alphabetic";
            ctx.fillText(
                run.text,
                style.italic ? 0 : positioned.x + offset.x,
                style.italic ? 0 : positioned.y + offset.y
            );
            if (debug) {
                textDrawMs += nowMs() - textStart;
            }
        }
        if (style.italic) {
            ctx.restore();
        }

        /*
            spoiler
        */

        if (style.spoiler) {
            const decoStart = debug ? nowMs() : 0;
            ctx.fillStyle = "#1e1e1efb";

            ctx.fillRect(
                positioned.x + offset.x,

                lineSizes[positioned.line].y + offset.y,

                positioned.width+1,

                lineSizes[positioned.line].height
            );
            if (debug) {
                decorationMs += nowMs() - decoStart;
            }
        }

        /*
            underline
        */

        if (style.underline) {
            const decoStart = debug ? nowMs() : 0;
            ctx.fillRect(
                positioned.x + offset.x,

                lineSizes[positioned.line].y +
                    lineSizes[positioned.line].height -
                    5 +
                    offset.y,

                positioned.width,

                5
            );
            if (debug) {
                decorationMs += nowMs() - decoStart;
            }
        }

        /*
            strikethrough
        */

        if (style.strikethrough) {
            const decoStart = debug ? nowMs() : 0;
            ctx.fillRect(
                positioned.x + offset.x,

                lineSizes[positioned.line].y +
                    lineSizes[positioned.line].height / 2 +
                    offset.y,

                positioned.width,

                5
            );
            if (debug) {
                decorationMs += nowMs() - decoStart;
            }
        }

        /*
            debug
        */

        if (debug) {
            const debugGuideStart = nowMs();
            ctx.strokeStyle = "lightgreen";
            for (const line of uniqueLines) {
                ctx.strokeRect(
                    lineSizes[line].x + offset.x,
                    lineSizes[line].y + offset.y,
                    lineSizes[line].width,
                    lineSizes[line].height
                );
            }
            ctx.strokeStyle = "green";
            ctx.strokeRect(offset.x, offset.y, layout.width, layout.height);

            ctx.strokeStyle = "red";
            ctx.strokeRect(
                positioned.x + offset.x,
                positioned.y + offset.y - positioned.ascent,
                positioned.width,
                0
            );
            ctx.strokeRect(
                positioned.x + offset.x,
                positioned.y + offset.y - positioned.ascent,
                0,
                positioned.height
            );
            ctx.strokeStyle = "blue";
            ctx.strokeRect(
                positioned.x + offset.x,
                positioned.y + offset.y,
                positioned.width,
                0
            );
            ctx.strokeRect(
                positioned.x + offset.x,
                positioned.y + offset.y + positioned.descent,
                positioned.width,
                0
            );
            debugGuideMs += nowMs() - debugGuideStart;
        }
    }

    if (debugMetrics && debug) {
        debugMetrics.push({
            label: `drawText:${metricLabel}:lineLayout`,
            ms: lineLayoutMs
        });
        debugMetrics.push({
            label: `drawText:${metricLabel}:styleFont`,
            ms: styleAndFontMs
        });
        debugMetrics.push({
            label: `drawText:${metricLabel}:textDraw`,
            ms: textDrawMs
        });
        debugMetrics.push({
            label: `drawText:${metricLabel}:emojiDraw`,
            ms: emojiDrawMs
        });
        debugMetrics.push({
            label: `drawText:${metricLabel}:decor`,
            ms: decorationMs
        });
        debugMetrics.push({
            label: `drawText:${metricLabel}:debugGuide`,
            ms: debugGuideMs
        });
        debugMetrics.push({
            label: `drawText:${metricLabel}:total`,
            ms: nowMs() - drawTextStart
        });
    }
}

async function getEmojiImage(emoji: string) {
    let img = new Image();

    const path =
        emojiMap.get(getCharUnified(emoji)) ??
        emojiMap.get(getCharUnified(emoji, false));

    if (path) img.src = readFileSync(path);

    await img.decode();
    return img;
}

export function getCharUnified(emoji: string, nonQualified = true, join = "-") {
    let codePoints = [...emoji].map((char) =>
        char.codePointAt(0)?.toString(16).toLowerCase()
    );
    if (nonQualified) {
        codePoints = codePoints.filter((code) => code !== "fe0f");
    }
    return codePoints.join(join);
}

function colorToRGBA(ctx: CanvasRenderingContext2D, color: string, alpha = 1) {
    ctx.fillStyle = color;

    const computed = ctx.fillStyle.toString();

    // #rgb / #rrggbb
    if (computed.startsWith("#")) {
        let hex = computed.slice(1);

        if (hex.length === 3) {
            hex = hex
                .split("")
                .map((v) => v + v)
                .join("");
        }

        const num = parseInt(hex, 16);

        const r = (num >> 16) & 255;
        const g = (num >> 8) & 255;
        const b = num & 255;

        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // rgb(...)
    if (computed.startsWith("rgb(")) {
        const values = computed.replace(/[^\d,]/g, "").split(",");

        return `rgba(${values[0]}, ${values[1]}, ${values[2]}, ${alpha})`;
    }

    // rgba(...)
    if (computed.startsWith("rgba(")) {
        const values = computed.replace(/[^\d,.]/g, "").split(",");

        return `rgba(${values[0]}, ${values[1]}, ${values[2]}, ${alpha})`;
    }

    return color;
}
