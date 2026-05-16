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

export async function render({
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
}) {
    const canvas = new Canvas(WIDTH, HEIGHT);

    const ctx = canvas.getContext("2d");

    /*
    background
  */

    await drawBackground(ctx, direction, color, icon);

    /*
    parse
    */

    const name_runs = textToRuns(name);
    const id_runs = textToRuns(id);
    const nky_runs = textToRuns("Powered by nikkorinyuki/makeit");
    const text_runs = markdown ? markdownToRuns(text) : textToRuns(text);

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

    const { layout: name_layout } = findBestFontSize(
        ctx,
        name_runs,
        {},
        name_font,
        { x: 0, y: 0, width: MAX_TEXT_WIDTH, height: HEIGHT }, //仮置き
        30,
        30
    );
    const { layout: id_layout } = findBestFontSize(
        ctx,
        id_runs,
        {},
        id_font,
        { x: 0, y: 0, width: MAX_TEXT_WIDTH, height: HEIGHT }, //仮置き
        30,
        30
    );
    const { layout: nky_layout } = findBestFontSize(
        ctx,
        nky_runs,
        {},
        nky_font,
        { x: 0, y: 0, width: MAX_TEXT_WIDTH, height: HEIGHT }, //仮置き
        10,
        10
    );

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
        }
    );

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
        debug
    );
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
        debug
    );
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
        debug
    );
    await drawText(
        ctx,
        nky_layout,
        nky_font,
        {
            x: direction === "left" ? WIDTH - nky_layout.width - 5 : 5,
            y: HEIGHT - nky_layout.height
        },
        "#8F8F8F",
        debug
    );

    return await canvas.toBuffer(format);
}

async function drawBackground(
    ctx: CanvasRenderingContext2D,
    direction: `left` | `right` = `left`,
    color: string = "white",
    iconURL?: string
) {
    const image = new Image(iconURL ?? readFileSync("./assets/dummy_icon.png"));
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
    debug = false
) {
    const lines = layout.runs.map((r) => r.line);
    const uniqueLines = Array.from(new Set(lines));
    const lineSizes: { x: number; y: number; width: number; height: number }[] =
        [];
    //debug時のみwidthは計算される

    for (const line of uniqueLines) {
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
    }

    for (const positioned of layout.runs) {
        const run = positioned.run;

        const style = resolveStyle(run.style, {});

        ctx.font = Font.getCanvasFont(
            style,
            fontFamilies,
            positioned.fontSize
        ).toString();

        ctx.textBaseline = "alphabetic";

        /*
            code bg
        */

        if (style.code) {
            ctx.fillStyle = "#1e1e1e8e";

            ctx.fillRect(
                positioned.x + offset.x,

                lineSizes[positioned.line].y + offset.y,

                positioned.width,

                lineSizes[positioned.line].height
            );
        }

        /*
            quote line
        */

        if (style.quote && positioned.x === lineSizes[positioned.line].x) {
            ctx.fillStyle = "#1e1e1e";

            ctx.fillRect(
                positioned.x - 3 + offset.x,
                lineSizes[positioned.line].y + offset.y,

                5,
                lineSizes[positioned.line].height
            );
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
        } else {
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
        }
        if (style.italic) {
            ctx.restore();
        }

        /*
            spoiler
        */

        if (style.spoiler) {
            ctx.fillStyle = "#1e1e1efb";

            ctx.fillRect(
                positioned.x + offset.x,

                lineSizes[positioned.line].y + offset.y,

                positioned.width,

                lineSizes[positioned.line].height
            );
        }

        /*
            underline
        */

        if (style.underline) {
            ctx.fillRect(
                positioned.x + offset.x,

                lineSizes[positioned.line].y +
                    lineSizes[positioned.line].height -
                    5 +
                    offset.y,

                positioned.width,

                5
            );
        }

        /*
            strikethrough
        */

        if (style.strikethrough) {
            ctx.fillRect(
                positioned.x + offset.x,

                lineSizes[positioned.line].y +
                    lineSizes[positioned.line].height / 2 +
                    offset.y,

                positioned.width,

                5
            );
        }

        /*
            debug
        */

        if (debug) {
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
        }
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
