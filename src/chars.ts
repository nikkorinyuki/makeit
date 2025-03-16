import parse from "discord-markdown-parser";
import split from "graphemesplit";
import { Font } from "opentype.js";
import fs from "fs";
import { canvasWidth } from "./image";
const emojiData: emoji[] = require('emoji-datasource-twitter');

interface emoji {
    "name": string,
    "unified": string,
    "non_qualified"?: string,
    "docomo"?: string,
    "au"?: string,
    "softbank"?: string,
    "google"?: string,
    "image": string,
    "sheet_x": number,
    "sheet_y": number,
    "short_name": string,
    "short_names": string[],
    "text"?: string,
    "texts"?: string,
    "category": string,
    "subcategory": string,
    "sort_order": number,
    "added_in": string,
    "has_img_apple": boolean,
    "has_img_google": boolean,
    "has_img_twitter": boolean,
    "has_img_facebook": boolean,
    "skin_variations": {
        "1F3FB": {
            "unified": string,
            "image": string,
            "sheet_x": number,
            "sheet_y": number,
            "added_in": string,
            "has_img_apple": boolean,
            "has_img_google": boolean,
            "has_img_twitter": boolean,
            "has_img_facebook": boolean,
        }
    },
    "obsoletes": "ABCD-1234",
    "obsoleted_by": "5678-90EF"
}
export async function fill_chars_center(chars: { lines: char[][], fontSize: number }, x: number, y: number, width: number, height: number, debug: boolean = false) {
    const svg: string[] = [];
    const y1 = y;
    if (debug) console.log("最大の高さ:" + height);
    if (debug) console.log(chars)
    /*const margin_bottom = (height - (str.split("\n").map(e => calc_text_height(ctx, e)).reduce(function (sum, element) {
        return sum + element;
    }, 0))) / (str.split("\n").length + 1);*/
    if (debug) console.log(margin_bottom);
    const font = global.fonts["note_ja"];
    const EnterScale = (chars.fontSize) / font.unitsPerEm;
    const EnterCharHeight = (font.ascender - font.descender) * EnterScale;
    //y += margin_bottom;
    for (const line of chars.lines) {
        //await fillTextWithTwemoji(ctx, line, x + (width - ctx.measureText(line).width) / 2, y + textHeight / 2);
        const line_width = line.map(e => e.width).reduce(function (sum, element) {
            return sum + element;
        }, 0);
        const line_x = x + (width - line_width) / 2;
        const line_height = line.length != 0 ? Math.max(...line.map(e => e.height.total)) : EnterCharHeight;
        let w = 0;
        for (const char of line) {
            if (char.text == " ") console.log(char.width, JSON.stringify(char.height));
            let emoji = emojiData.find(e => e.unified.toUpperCase() === getCharUnified(char.text) || e.non_qualified?.toUpperCase() === getCharUnified(char.text));
            if (!emoji) emoji = emojiData.find(e => e.unified.toUpperCase() === char.text.charCodeAt(0).toString(16).toUpperCase() || e.non_qualified?.toUpperCase() === char.text.charCodeAt(0).toString(16).toUpperCase());
            if (debug) console.log(`${char.text} ${getCharUnified(char.text)} / Font:${char.fontname.toString()}`);
            const yc = y + (line_height - char.height.total) / 2;
            const yc2 = y + (line_height - char.height.ascender) / 2;
            if (emoji) {
                const emoji_image = emoji.has_img_twitter ? `node_modules/emoji-datasource-twitter/img/twitter/64/${emoji.image}`
                    : `node_modules/emoji-datasource-google/img/google/64/${emoji.image}`;
                svg.push(`<image href="${"data:image/png;base64," + fs.readFileSync(emoji_image).toString('base64')}" height="${Math.min(char.height.total, height + y1)}" width="${char.width}" x="${line_x + w}" y="${Math.min(y, height + y1)}" />`);
            } else {
                //if (char.fontRem == 0.8125) ctx.fillStyle = "color-mix( in oklab, hsl(228 calc(1 * 5.155%) 38.039% / 1) 100%, black 0% )"; else 
                //ctx.font = `normal ${char.bold ? "700" : "500"} ${chars.fontSize * char.fontRem}px ${char.fontname}`;
                let path_y = yc + char.height.ascender;
                if (char.text == "…") {
                    path_y = y + line_height;
                } else if (char.height.ascender < char.height.descender || char.text.match(/[.,]/)) {
                    path_y = y + line_height * 0.8;
                }
                if (char.fontname != "note_ja" && char.fontname != "note_ja_bold" && char.fontname != "note_en") {
                    if (char.text.match(/[A-Z]/)) {
                        path_y = yc2 + char.height.ascender;
                    } else if (char.text.match(/[a-z]/)) {
                        path_y = y + 15;
                    }
                } else {
                    if (char.text == "…") {
                        path_y += line_height * 0.3;
                    }
                }
                const path = char.font.getPath(
                    char.text,
                    line_x + w,
                    Math.min(path_y, height + y1),
                    chars.fontSize * char.fontRem,
                    {});
                path.strokeWidth = char.bold ? 2 : 1;
                path.fill = char.color ?? "#000";
                svg.push(path.toSVG(2));
            }
            if (char.underline) svg.push(line_stroke(line_x + w, Math.min(y + line_height, height + y1), line_x + w + char.width, Math.min(y + line_height, height + y1), char.color ?? "black", 2));
            if (debug) svg.push(line_stroke(line_x + w, yc, line_x + w, yc + char.height.ascender));
            if (debug) svg.push(line_stroke(line_x + w, yc + char.height.ascender, line_x + w, yc + char.height.total, "#465DAA"));
            w += char.width;
        }
        if (debug) svg.push(line_stroke(0, y, canvasWidth, y));
        if (debug) svg.push(line_stroke(line_x, y + (line_height / 2), line_x + line_width, y + (line_height / 2)));
        if (debug) svg.push(line_stroke(0, y + line_height, canvasWidth, y + line_height));
        y += line_height + margin_bottom;
    }
    return svg.join("");
}

function line_stroke(x1: number, y1: number, x2: number, y2: number, color: string = "#00ff00", width: number = 1) {
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}"/>`;

}

interface char {
    text: string,
    font: Font;
    fontname: (keyof typeof global.fonts);
    width?: number,
    height?: {
        total: number,
        ascender: number,
        descender: number,
    },
    fontRem: number,
    color?: string,
    bold?: boolean,
    italic?: boolean,
    underline?: boolean,
    strikethrough?: boolean,
    code?: boolean,
    quote?: boolean,
    spoiler?: boolean
}
interface char_option {
    color?: string,
    fonts?: (keyof typeof global.fonts)[],
    fontRem?: number,
    bold?: boolean,
    italic?: boolean,
    underline?: boolean,
    strikethrough?: boolean,
    code?: boolean,
    quote?: boolean,
    spoiler?: boolean
}
const h1: char_option = { "fontRem": 1.5, "bold": true };
const h2: char_option = { "fontRem": 1.25, "bold": true };
const h3: char_option = { "fontRem": 1, "bold": true };
const subtext: char_option = { "fontRem": 0.8125, "fonts": ["note_ja", "note_en", "NotoSansJP-Medium", "NotoSansKR-Medium", "NotoSansSC-Medium"] };
function markdown_to_chars(markdown_json: import("@khanacademy/simple-markdown").SingleASTNode[], option: char_option = {}): char[] {
    markdown_json = mergeObjects(markdown_json);
    const result: char[] = [];
    option = Object.assign({ "fonts": ["note_ja_bold", "note_ja", "note_en", "NotoSansJP-Medium", "NotoSansKR-Medium", "NotoSansSC-Medium"], "fontRem": 1, "bold": false, "italic": false, "underline": false, "strikethrough": false, "code": false, "quote": false, "spoiler": false }, option);
    for (let index = 0; index < markdown_json.length; index++) {
        const markdown = markdown_json[index];
        let _option: char_option = JSON.parse(JSON.stringify(option));
        switch (markdown.type) {
            case "text":
                const content = markdown.content;
                result.push(...split(content).map(e => { return { "text": e, ...get_best_font(e, _option.fonts), "fontRem": _option.fontRem, ...option }; }));
                break;
            case "heading":
                if (markdown.level == 1) _option = Object.assign(_option, h1); else if (markdown.level == 2) _option = Object.assign(_option, h2); else if (markdown.level == 3) _option = Object.assign(_option, h3);
                if (markdown_json[index + 1]) markdown.content.push({ "type": "br" });
                result.push(...markdown_to_chars(markdown.content, _option));
                break;
            case "subtext":
                _option = Object.assign(_option, subtext);
                if (markdown_json[index + 1]) markdown.content.push({ "type": "br" });
                result.push(...markdown_to_chars(markdown.content, _option));
                break;
            case "strong":
                _option.bold = true;
                result.push(...markdown_to_chars(markdown.content, _option));
                break;
            case "em":
                _option.italic = true;
                result.push(...markdown_to_chars(markdown.content, _option));
                break;
            case "underline":
                _option.underline = true;
                result.push(...markdown_to_chars(markdown.content, _option));
                break;
            case "strikethrough":
                _option.strikethrough = true;
                result.push(...markdown_to_chars(markdown.content, _option));
                break;
            case "inlineCode":
            case "codeBlock":
                _option.code = true;
                result.push(...markdown_to_chars([{ "type": "text", "content": markdown.content }], _option));
                break;
            case "blockQuote":
                _option.quote = true;
                result.push(...markdown_to_chars(markdown.content, _option));
                break;
            case "spoiler":
                _option.spoiler = true;
                result.push(...markdown_to_chars(markdown.content, _option));
                break;
            case "br":
                result.push(...markdown_to_chars([{ "type": "text", "content": "\n" }], _option));
                break;
            case "twemoji":
                result.push(...markdown_to_chars([{ "type": "text", "content": markdown.name }], _option));
                break;
            case "emoji":
                break;
            case "everyone":
            case "here":
                result.push(...markdown_to_chars([{ "type": "text", "content": "@" + markdown.type }], _option));
                break;
            default:
                console.log(markdown.type);
                if (!markdown.content) break;
                if (Array.isArray(markdown.content)) result.push(...markdown_to_chars(markdown.content, _option));
                else result.push(...markdown_to_chars([markdown.content], _option));
        }
    }
    return result;
}

function mergeObjects(object: import("@khanacademy/simple-markdown").SingleASTNode[]): import("@khanacademy/simple-markdown").SingleASTNode[] {
    const mergedData = [];
    for (const item of object) {
        const last = mergedData[mergedData.length - 1];

        // "content"以外のキーがすべて一致するかを検証
        const isSameGroup = last && Object.keys(item).every(key =>
            typeof key === "string" && (key === "content" || last[key] === item[key])
        );

        if (isSameGroup) {
            // "content"を結合
            if (typeof last.content === "string" && typeof item.content === "string") {
                last.content += item.content;
            } else if (Array.isArray(item.content)) {
                item.content = mergeObjects(item.content);
                mergedData.push({ ...item });
            } else {
                //throw new Error("contentの型が一致していません");
            }
        } else {
            // 新しいオブジェクトとして追加
            mergedData.push({ ...item });
        }
    }
    return mergedData;
}

function get_best_font(char: string, fontFamily: (keyof typeof global.fonts)[] = []) {
    //return { font: fonts["NotoSerifCJK-Medium"], fontname: "note_en,note_ja_bold,note_ja,NotoSerifCJK-Medium,emoji" };
    for (const fontName of fontFamily) {
        const font = global.fonts[fontName];
        if (!font) throw new Error(String(fontName) + "フォントが見つかりませんでした。");
        if (isCharacterSupported(font, char) && !(char.match(/\d/) && String(fontName).match("en"))) return { font, fontname: fontName };
    }
    return { font: global.fonts[fontFamily[0]], fontname: fontFamily[0] };
}

function isCharacterSupported(font: Font, char: string) {
    const glyph = font.charToGlyph(char);
    return glyph.name !== '.notdef' && glyph.unicodes.length !== 0;
}

export function calc_best_size(text: string, width: number, height: number, maxFontSize: number, option?: char_option, markdown = true, minFontSize = 1) {
    //メモ :見出し→太字 その他→標準 と扱う
    const chars: char[] = markdown ? markdown_to_chars(parse(text, 'extended'), option) : split(text).map(e => { return { "text": e, ...get_best_font(e, option.fonts ?? ["note_ja_bold", "note_ja", "note_en", "NotoSansJP-Medium", "NotoSansKR-Medium", "NotoSansSC-Medium"]), "fontRem": 1, ...option } });
    let fontSize = maxFontSize;
    while (true) {

        const { text, totalWidth, totalHeight, lines } = calculateTextDimensions(chars, fontSize, width);

        if ((totalWidth <= width && totalHeight <= height) || fontSize == minFontSize) {
            return { text, fontSize, totalWidth, totalHeight, lines };
        }
        fontSize--; // ステップを調整可能
    }
}

export const margin_bottom = 10;

// テキスト全体の寸法を計算
function calculateTextDimensions(chars: char[], fontSize: number, maxWidth: number) {
    let lines: char[][] = [];
    let line = 0;
    const font = global.fonts["note_ja"];
    const あglyph = font.charToGlyph("あ");
    const あcharWidth = あglyph.advanceWidth;//使われなかった
    const あcharHeight = あglyph.yMax - あglyph.yMin;
    const defaultscale = fontSize / font.unitsPerEm;

    for (const char of chars) {
        const emoji = emojiData.find(e => e.unified.toUpperCase() === getCharUnified(char.text) || e.non_qualified?.toUpperCase() === getCharUnified(char.text));
        const scale = defaultscale * char.fontRem;
        const glyph = char.font.charToGlyph(char.text);
        const charWidth = glyph.advanceWidth * scale;
        //const charHeight = (char.font.ascender - char.font.descender) * scale;//不正確
        const ascender = glyph.yMax ? glyph.yMax * scale : null;
        const descender = glyph.yMin ? Math.abs(glyph.yMin * scale) : null;
        const charHeight = (!ascender || !descender) ? (あcharHeight * scale) : (ascender + descender);

        if (char.text == "\n") {
            line++;
            continue;
        }
        //if (lines[line]) console.log(lines[line].map(e => e.width).reduce((x, y) => x + y));
        if (lines[line] && (lines[line].map(e => e.width).reduce((x, y) => x + y) + charWidth) > maxWidth) {//横幅超える
            line++;
        }

        while (lines[line] == undefined) {
            lines.push([]);
        };
        lines[line].push(Object.assign(char, {
            "width": (emoji == undefined ? charWidth : あcharHeight * scale), "height": {
                "total": (emoji == undefined ? charHeight : あcharHeight * scale),
                "ascender": (emoji == undefined ? ascender : あcharHeight * scale) ?? charHeight,
                "descender": (emoji == undefined ? descender : 0) ?? 0,
            }
        }));
    }

    const text = lines.map(e => e.map(ee => ee.text).join("")).join("\n");
    const totalWidth = Math.max(...lines.map(e => e.length == 0 ? 0 : (e.map(ee => ee.width).reduce((x, y) => x + y))));
    const _height = lines.map(e => e.length == 0 ? (あcharHeight * defaultscale) : Math.max(...e.map(ee => ee.height.total))).reduce((x, y) => x + y);
    const totalHeight = _height + ((lines.length - 1) * margin_bottom);

    return { text, totalWidth, totalHeight, lines };
}

function getCharUnified(emoji: string, join = "-") {
    const codePoints = [...emoji].map(char => char.codePointAt(0).toString(16).toUpperCase());
    return codePoints.join(join);
}