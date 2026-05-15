export type TextStyle = {
    scale: number;

    bold: boolean;
    italic: boolean;

    underline: boolean;
    strikethrough: boolean;

    color: string | undefined;
    backgroundColor: string | undefined;

    code: boolean;
    quote: boolean;
    spoiler: boolean;
};

export type TextRun = {
    type: "text";
    text: string;

    style: Partial<TextStyle>;
};

export type EmojiRun = {
    type: "emoji";
    emoji: string;
    style: Partial<TextStyle>;
};

export type Run = TextRun | EmojiRun;

export type LineItem = {
    run: Run;
    width: number;
};

export type Line = {
    items: LineItem[];
    width: number;
    height: number;
};
