export const WIDTH = 1200;
export const HEIGHT = 630;

export const GOLDEN_RADIO = 1.618; // 1:1.618
export const CIRCLE_RADIUS = WIDTH * (1 / (1 + GOLDEN_RADIO));
export const TEXT_MARGIN = 10;
export const MARGIN = 50;
export const MAX_TEXT_WIDTH =
    WIDTH * (GOLDEN_RADIO / (1 + GOLDEN_RADIO)) - MARGIN;

export const MIN_FONT = 1;
export const MAX_FONT = 80;
