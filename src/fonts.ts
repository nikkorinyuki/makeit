
import { readFileSync } from "fs";
import opentype, { Font as OFont } from "opentype.js";
import { FontLibrary } from "skia-canvas";
import { TextStyle } from "./type";

export const fonts: { [key: string]: OFont | null } = {
    "SourGummy-Regular": null,
    "PopGothicCjkJp-Bold": null,
    "NotoSansCanadianAboriginal-Bold": null,
    "NotoSansJP-Medium": null,
    "NotoSansKR-Medium": null,
    "NotoSansSC-Medium": null,
    "NotoSansMath-Regular": null
};
for (const key in fonts) {
    const e = "ttf";
    fonts[key] = opentype.parse(readFileSync(`./assets/${key}.${e}`));
    console.log("Font loaded(opentype):", key);
    FontLibrary.use(key, [`./assets/${key}.${e}`]);
    console.log("Font loaded(skia-canvas):", key);
}

export function getBestFont(
    char: string,
    fontFamily: (keyof typeof fonts)[] = []
) {
    for (const fontName of fontFamily) {
        const font = fonts[fontName];
        if (!font)
            throw new Error(
                String(fontName) + "フォントが見つかりませんでした。"
            );
        if (isCharacterSupported(font, char))
            return { font, fontname: fontName };
    }
    return { font: fonts[fontFamily[0]], fontname: fontFamily[0] };
}

function isCharacterSupported(font: OFont, char: string) {
    const glyph = font.charToGlyph(char);
    return glyph.name !== ".notdef" && glyph.unicodes.length !== 0;
}

export class Font {
    family: string[];
    size: string;
    stretch: string;
    style: string;
    variant: string;
    weight: string | number;
    lineHeight: string;

    constructor({
        family = ["sans-serif"],
        size = "16px",
        stretch = "normal",
        style = "normal",
        variant = "normal",
        weight = "normal",
        lineHeight = "normal"
    }: Partial<{
        family: string[];
        size: string | number;
        stretch: string;
        style: string;
        variant: string;
        weight: string | number;
        lineHeight: string | number;
    }> = {}) {
        this.family = family;
        this.size = typeof size === "number" ? `${size}px` : size;
        this.stretch = stretch;
        this.style = style;
        this.variant = variant;
        this.weight = weight;
        this.lineHeight =
        typeof lineHeight === "number" ? `${lineHeight}px` : lineHeight;
    }

    static getCanvasFont(
        style: Required<TextStyle>,
        fontFamilies: string[],
        fontSize: number
    ): Font {
        return new Font({
            family: fontFamilies,
            size: fontSize,
            style: style.italic ? "italic " : "",
            weight: style.bold ? "bold" : "normal",
        });
    }

    /**
     * CSS font shorthand を生成
     */
    toString(): string {
        return [
            this.style,
            this.variant,
            this.weight,
            this.stretch,
            `${this.size}/${this.lineHeight}`,
            this.family.join(", ")
        ]
            .filter(Boolean)
            .join(" ");
    }

    /**
     * 一部だけ変更して複製
     */
    clone(
        overrides: Partial<{
            family: string[];
            size: string | number;
            stretch: string;
            style: string;
            variant: string;
            weight: string | number;
            lineHeight: string | number;
        }> = {}
    ): Font {
        return new Font({
            family: this.family,
            size: this.size,
            stretch: this.stretch,
            style: this.style,
            variant: this.variant,
            weight: this.weight,
            lineHeight: this.lineHeight,
            ...overrides
        });
    }

    /**
     * Object形式で取得
     */
    toJSON() {
        return {
            family: this.family,
            size: this.size,
            stretch: this.stretch,
            style: this.style,
            variant: this.variant,
            weight: this.weight,
            lineHeight: this.lineHeight
        };
    }

    /**
     * CanvasRenderingContext2D に適用
     */
    apply(ctx: CanvasRenderingContext2D) {
        ctx.font = this.toString();
    }
}
