// global.d.ts
import opentype from 'opentype.js';

export { };

declare global {
    var fonts: {
        "emoji": opentype.Font | null,
        "note_ja": opentype.Font | null,
        "note_ja_bold": opentype.Font | null,
        "note_en": opentype.Font | null,
        "name": opentype.Font | null,
        "NotoSansJP-Medium": opentype.Font | null,
        "NotoSansKR-Medium": opentype.Font | null,
        "NotoSansSC-Medium": opentype.Font | null,
    }
}