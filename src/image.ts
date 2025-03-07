import sharp from 'sharp';
import * as opentype from 'opentype.js';
import axios from 'axios';
import fs from 'fs';
import { calc_best_size, fill_chars_center } from './chars';

const canvasWidth = 1200;
const canvasHeight = 630;
const goldenRatio = 1.618;
const circle_radius = canvasWidth * (1 / 2.618);
const margin = 50;
const maxTextWidth = canvasWidth * (goldenRatio / 2.618) - margin;

interface query {
    text: string;
    icon: string;
    name: string;
    id: string;
    debug: string;
    markdown: string;
    align: (`left` | `right`);
    color: string;
}

export async function generateImage(query: query) {

    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${canvasWidth}" height="${canvasHeight}">
      <!-- 背景 (灰色) -->
      <rect style="fill:black;" width="100%" height="100%" />
      ${await getBackground(query.align, query.color, query.icon)}
      <!-- 指定した文字列をSVGパスに変換 -->
      ${await fill_chars_center(calc_best_size(query.text, canvasWidth, canvasHeight, 40), 0, 0, canvasWidth, canvasHeight)}
      <g transform="translate(70, 70)">
        ${generateTextPath(query.text, 1060, 80, { align: "center", color: "#555", lines: 4 })}
      </g>
      
      <!-- ユーザー名をSVGパスに変換 -->
      <g transform="translate(70, 470)">
        ${generateTextPath(query.name, 1060, 64, { align: "right", color: "#ccc", lines: 1 })}
      </g>
    </svg>`;

    const buffer = await sharp(Buffer.from(svg))
        .png()
        .toBuffer();
    return buffer;
}

async function getBackground(align: (`left` | `right`) = `left`, color: string = "white", iconURL?: string) {
    let icon = "";
    if (iconURL) {
        const response = await axios.get(iconURL, { responseType: 'arraybuffer' });
        // Content-Type を取得（サーバーが正しく返している場合）
        const contentType = response.headers['content-type'] || 'image/png'; // デフォルトは image/png

        // Base64 エンコード
        const base64String = Buffer.from(response.data, 'binary').toString('base64');

        // Data URL に変換
        const dataUrl = `data:${contentType};base64,${base64String}`;
        icon = dataUrl;
    } else {
        icon = "data:image/png;base64," + fs.readFileSync('./fonts/dummy_icon.png').toString('base64');
    }
    const x = align == "right" ? canvasWidth + circle_radius : -circle_radius;
    const y = canvasHeight * (3 / 4);
    const iconPositionX = align == "right" ? canvasWidth * (goldenRatio / (1 + goldenRatio)) : canvasWidth * (1 / (1 + goldenRatio)) - canvasHeight;

    return `
    <defs>
    <radialGradient id="fadeMask">
      <stop offset="0%"   stop-color="${color}" stop-opacity="0" />
      <stop offset="${80 * (2 / 3)}%"   stop-color="${color}" stop-opacity="0" />
      <stop offset="${100 * (2 / 3)}%" stop-color="${color}" stop-opacity="1"/>
      <stop offset="100%" stop-color="${color}" stop-opacity="1"/>
    </radialGradient>
    </defs>

    <rect style="fill:${color};" width="100%" height="100%" />
    <image href="${icon}" height="${canvasHeight}" width="${canvasHeight}" x="${iconPositionX}" y="${0}" />
    <circle cx="${x}" cy="${y}" r="${circle_radius * 3}" fill="url(#fadeMask)" />
    `;
}

/**
 * 生成するテキストのオプション
 */
type TextOptions = {
    align?: `left` | `right` | `center`,
    color?: string,
    lines?: number,
}


/**
 * 指定した文字列からSVGパスを生成する
 */
function generateTextPath(text: string, width: number, lineHight: number, textOptions?: TextOptions) {
    // テキストオプションのデフォルト値を設定
    const font = global.fonts['NotoSansJP-Medium'];
    textOptions = {
        align: textOptions?.align ?? `left`,
        color: textOptions?.color ?? `#000`,
        lines: textOptions?.lines ?? 1,
    };

    // opentype: 描画オプション
    const renderOptions: opentype.RenderOptions = {};

    const columns = [``];

    // STEP1: 改行位置を算出して行ごとに分解
    for (let i = 0; i < text.length; i++) {
        // 1文字取得
        const char = text.charAt(i);

        // opentype: 改行位置を算出する為に長さを計測
        const measureWidth = font.getAdvanceWidth(
            columns[columns.length - 1] + char,
            lineHight,
            renderOptions
        );

        // 改行位置を超えている場合
        if (width < measureWidth) {
            // 次の行にする
            columns.push(``);
        }

        // 現在行に1文字追加
        columns[columns.length - 1] += char;
    }

    const paths: opentype.Path[] = [];

    // STEP2: 行ごとにSVGパスを生成
    for (let i = 0; i < columns.length; i++) {
        // opentype: 1行の長さを計測
        const measureWidth = font.getAdvanceWidth(
            columns[i],
            lineHight,
            renderOptions
        );

        let offsetX = 0;

        // 揃える位置に応じてオフセットを算出
        if (textOptions.align === `right`) {
            offsetX = width - measureWidth;
        }
        else if (textOptions.align === `center`) {
            offsetX = (width - measureWidth) / 2;
        }
        else {
            offsetX = 0;
        }

        // opentype: １行分の文字列をパスに変換
        const path = font.getPath(
            columns[i],
            offsetX,
            lineHight * i + lineHight,
            lineHight,
            renderOptions);

        // 文字色を指定
        path.fill = textOptions.color;

        paths.push(path);
    }

    // STEP3: 指定した行数を超えていれば制限する
    if (textOptions.lines < paths.length) {
        paths.length = textOptions.lines;
    }

    // STEP4: 複数行を結合
    return paths.map(path => path.toSVG(2)).join();
}