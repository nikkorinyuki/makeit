import parser from "discord-markdown-parser";
import split from "graphemesplit";
import { emojiMap } from "./emoji";
import { getCharUnified } from "./render";
import { Run, TextStyle } from "./type";

const h1: Partial<TextStyle> = { scale: 1.5, bold: true };
const h2: Partial<TextStyle> = { scale: 1.25, bold: true };
const h3: Partial<TextStyle> = { scale: 1, bold: true };
const subtext: Partial<TextStyle> = { scale: 0.8125 };
export function markdownToRuns(markdown: string): Run[] {
    const ast = parser(markdown);

    const runs: Run[] = [];

    function walk(
        node:
            | import("simple-markdown").SingleASTNode
            | import("simple-markdown").SingleASTNode[],
        style: Partial<TextStyle> = {}
    ) {
        if (Array.isArray(node)) {
            for (const n of node) walk(n, style);
            return;
        }

        switch (node.type) {
            case "text":
                const content = node.content;
                pushText(content, style);
                break;
            case "heading":
                if (node.level == 1) style = Object.assign(style, h1);
                else if (node.level == 2) style = Object.assign(style, h2);
                else if (node.level == 3) style = Object.assign(style, h3);
                node.content.push({ type: "br" });
                walk(node.content, style);
                break;
            case "subtext":
                style = Object.assign(style, subtext);
                node.content.push({ type: "br" });
                walk(node.content, style);
                break;
            case "strong":
                style.bold = true;
                walk(node.content, style);
                break;
            case "em":
                style.italic = true;
                walk(node.content, style);
                break;
            case "underline":
                style.underline = true;
                walk(node.content, style);
                break;
            case "strikethrough":
                style.strikethrough = true;
                walk(node.content, style);
                break;
            case "inlineCode":
            case "codeBlock":
                style.code = true;
                pushText(node.content, style);
                break;
            case "blockQuote":
                style.quote = true;
                walk(node.content, style);
                break;
            case "spoiler":
                style.spoiler = true;
                walk(node.content, style);
                break;
            case "br":
                pushText("\n", style);
                break;
            case "twemoji":
                pushText(node.name, style, true);
                break;
            case "emoji":
                break;
            case "everyone":
            case "here":
                pushText("@" + node.type, style);
                break;
            default:
                console.log("Unhandled markdown:", node.type);
                if (!node.content) break;
                if (Array.isArray(node.content))
                    walk(node.content as any, style);
                else walk([node.content] as any, style);
        }
    }

    function pushText(
        text: string,
        style: Partial<TextStyle>,
        isEmoji = false
    ) {
        let buffer = "";

        for (const char of [...text]) {
            if (isEmoji) {
                if (buffer) {
                    runs.push({
                        type: "text",
                        text: buffer,
                        style
                    });

                    buffer = "";
                }

                runs.push({
                    type: "emoji",
                    emoji: char,
                    style
                });

                continue;
            }

            buffer += char;
        }

        if (buffer) {
            runs.push({
                type: "text",
                text: buffer,
                style
            });
        }
    }

    walk(ast);

    return runs.filter(
        (r, i) => i != runs.length || (r.type == "text" && r.text != "\n")
    );
}

export function textToRuns(text: string): Run[] {
    return split(text).map((e) => {
        const path =
            emojiMap.get(getCharUnified(e)) ??
            emojiMap.get(getCharUnified(e, false));
        if (path)
            return {
                type: "emoji",
                emoji: e,
                style: {}
            };
        return {
            type: "text",
            text: e,
            style: {}
        };
    });
}
