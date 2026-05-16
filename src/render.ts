import { readFileSync } from "fs";
import { Canvas, CanvasRenderingContext2D, Image } from "skia-canvas";
import {
    CIRCLE_RADIUS,
    GOLDEN_RADIO,
    HEIGHT,
    MARGIN,
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
    format: `png` | `jpeg` | `webp` | `tiff` | `avif` | `svg` | `raw`;
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
    const nky_font = ["NotoSansCanadianAboriginal-Bold"];
    const text_font = [
        "SourGummy-Thin",
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
        20,
        20
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
        tcolor
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
        tcolor
    );
    await drawText(
        ctx,
        id_layout,
        name_font,
        {
            x:
                direction === "left"
                    ? (MARGIN + MAX_TEXT_WIDTH - id_layout.width) / 2 +
                      CIRCLE_RADIUS
                    : (MARGIN + MAX_TEXT_WIDTH - id_layout.width) / 2,
            y: id_y
        },
        "#8F8F8F"
    );
    await drawText(
        ctx,
        nky_layout,
        text_font,
        {
            x:
                direction === "left"
                    ? WIDTH - TEXT_MARGIN - nky_layout.width
                    : MARGIN,
            y: HEIGHT - TEXT_MARGIN - nky_layout.height
        },
        "#8F8F8F"
    );

    await canvas.saveAs("./output.png");
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
    debug = true
) {
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

        if (style.backgroundColor) {
            ctx.fillStyle = style.backgroundColor;

            ctx.fillRect(
                positioned.x - 4 + offset.x,

                positioned.y - positioned.fontSize + offset.y,

                positioned.width + 8,

                positioned.fontSize * 1.25
            );
        }

        /*
            quote line
        */

        if (style.quote) {
            ctx.fillStyle = "#5865f2";

            ctx.fillRect(
                positioned.x - 10 + offset.x,
                positioned.y - positioned.fontSize + offset.y,

                4,
                positioned.height
            );
        }

        /*
            text
        */

        if (run.type === "emoji") {
            const image = await getEmojiImage(run.emoji);

            if (image) {
                ctx.drawImage(
                    image,

                    positioned.x + offset.x,

                    positioned.y + offset.y,

                    positioned.width,
                    positioned.height
                );
            }
        } else {
            ctx.fillStyle = style.color ?? color ?? "#000";

            ctx.textBaseline = "alphabetic";
            ctx.fillText(
                run.text,
                positioned.x + offset.x,
                positioned.y + offset.y
            );
        }

        /*
            spoiler
        */

        if (style.spoiler) {
            ctx.fillStyle = "oklab(0.618397, 0.00218117, -0.0117887)";

            ctx.fillRect(
                positioned.x + offset.x,
                positioned.y - positioned.ascent + offset.y,

                positioned.width,

                positioned.height
            );
        }

        /*
            underline
        */

        if (style.underline) {
            ctx.fillRect(
                positioned.x + offset.x,

                positioned.y + positioned.ascent + offset.y,

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

                positioned.y + positioned.ascent / 2 + offset.y,

                positioned.width,

                5
            );
        }

        if (run.type === "text" && debug) {
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
        } else if (run.type === "emoji" && debug) {
            //絵文字のbaselineはtopなのでずらす
            ctx.strokeStyle = "red";
            ctx.strokeRect(
                positioned.x + offset.x,
                positioned.y + offset.y,
                positioned.width,
                0
            );
            ctx.strokeRect(
                positioned.x + offset.x,
                positioned.y + offset.y,
                0,
                positioned.height
            );
            ctx.strokeStyle = "blue";
            ctx.strokeRect(
                positioned.x + offset.x,
                positioned.y + offset.y + positioned.height,
                positioned.width,
                0
            );
            ctx.strokeRect(
                positioned.x + offset.x,
                positioned.y + offset.y + positioned.height / 2,
                positioned.width,
                0
            );
        }
    }
    if (debug) {
        ctx.strokeStyle = "lightgreen";
        const lines = layout.runs.map((r) => r.line);
        const uniqueLines = Array.from(new Set(lines));
        for (const line of uniqueLines) {
            const lineRuns = layout.runs.filter((r) => r.line === line);
            const minX = Math.min(...lineRuns.map((r) => r.x));
            const maxX = Math.max(...lineRuns.map((r) => r.x + r.width));
            const maxAscent = Math.max(...lineRuns.map((p) => p.ascent));
            const maxDescent = Math.max(...lineRuns.map((p) => p.descent));
            const height = maxAscent + maxDescent;
            ctx.strokeRect(
                minX + offset.x,
                lineRuns[0].y - maxAscent + offset.y,
                maxX - minX,
                height
            );
        }
        ctx.strokeStyle = "green";
        ctx.strokeRect(offset.x, offset.y, layout.width, layout.height);
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

    const computed = ctx.fillStyle as string;
    //TODO:CanvasTextureになるか確認

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
