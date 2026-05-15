import { TextStyle } from "./type";

export function resolveStyle(
    style: Partial<TextStyle>,
    defaultTextStyle: Partial<TextStyle>
): Required<TextStyle> {
    return Object.assign(
        {
            scale: 1,
            bold: false,
            italic: false,

            underline: false,
            strikethrough: false,

            code: false,
            quote: false,
            spoiler: false
        } as TextStyle,
        defaultTextStyle,
        style
    );
}