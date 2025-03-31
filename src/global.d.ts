// global.d.ts
import opentype from 'opentype.js';

export { };

declare global {
    var fonts: {
        "SourGummy-Thin": opentype.Font | null,
        "PopGothicCjkJp-Bold": opentype.Font | null,
        "NotoSansCanadianAboriginal-Bold": opentype.Font | null,
        "NotoSansJP-Medium": opentype.Font | null,
        "NotoSansKR-Medium": opentype.Font | null,
        "NotoSansSC-Medium": opentype.Font | null,
        "NotoSansMath-Regular": opentype.Font | null
    }
}