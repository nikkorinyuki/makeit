type emoji = {
    name: string;
    unified: string;
    non_qualified?: string;
    docomo?: string;
    au?: string;
    softbank?: string;
    google?: string;
    image: string;
    sheet_x: number;
    sheet_y: number;
    short_name: string;
    short_names: string[];
    text?: string;
    texts?: string;
    category: string;
    subcategory: string;
    sort_order: number;
    added_in: string;
    has_img_apple: boolean;
    has_img_google: boolean;
    has_img_twitter: boolean;
    has_img_facebook: boolean;
    skin_variations: {
        "1F3FB": {
            unified: string;
            image: string;
            sheet_x: number;
            sheet_y: number;
            added_in: string;
            has_img_apple: boolean;
            has_img_google: boolean;
            has_img_twitter: boolean;
            has_img_facebook: boolean;
        };
    };
    obsoletes: "ABCD-1234";
    obsoleted_by: "5678-90EF";
};
const emojiData: emoji[] = require("emoji-datasource-twitter");

export const emojiMap = new Map<string, string>();

for (const emoji of emojiData) {
    if (!emoji.has_img_twitter && !emoji.has_img_google) continue;

    const emoji_image = emoji.has_img_twitter
        ? `node_modules/emoji-datasource-twitter/img/twitter/64/${emoji.image}`
        : `node_modules/emoji-datasource-google/img/google/64/${emoji.image}`;

    const name = emoji.non_qualified ?? emoji.unified;

    emojiMap.set(name.toLowerCase(), emoji_image);
}
