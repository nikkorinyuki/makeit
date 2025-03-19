import opentype from 'opentype.js';
import { generateImage, query } from "./image";
import { FastifyBaseLogger, FastifySchema, FastifyTypeProviderDefault, RawServerDefault, RouteGenericInterface, RouteShorthandOptions } from 'fastify';
import { IncomingMessage, ServerResponse } from 'http';
import { format } from 'path';
import cors from '@fastify/cors'


const fastify = require("fastify")({ logger: true, trustProxy: true });

fastify.register(cors, {
    // 全てのオリジンからのリクエストを許可
    origin: "*",
});
const port = Number(process.env.PORT) || 3001;
fastify.listen({ port, host: "0.0.0.0" }, (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Server    is    running    at    ${address}`);
});

global.fonts = {
    "SourGummy-Thin": null,
    "PopGothicCjkJp-Regular": null,
    "note_en": null,
    "name": null,
    "NotoSansJP-Medium": null,
    "NotoSansKR-Medium": null,
    "NotoSansSC-Medium": null,
};
for (const key in global.fonts) {
    const e = global.fonts[key] ?? "ttf";
    global.fonts[key] = opentype.loadSync(`./fonts/${key}.${e}`);

    console.log(key);
}

const ValidationSchema = {
    type: 'object',
    required: ["text", "name", "id"],
    properties: {
        text: { type: 'string' },
        icon: { type: 'string' },
        name: { type: 'string' },
        id: { type: 'string' },
        debug: { type: "boolean" },
        markdown: { type: "boolean" },
        direction: { type: 'string', enum: ['left', 'right'] },
        color: { type: 'string' },
        tcolor: { type: 'string' },
        format: { type: 'string', enum: ['png', 'jpeg', 'webp', 'tiff', 'avif', 'svg', 'raw'] }
    }
};

const opts: RouteShorthandOptions<RawServerDefault, IncomingMessage, ServerResponse<IncomingMessage>, RouteGenericInterface, unknown, FastifySchema, FastifyTypeProviderDefault, FastifyBaseLogger> = {
    schema: {
        body: ValidationSchema
    }
}

fastify.get("/", async (request, reply) => {
    console.log(request.ips);
    console.log(request.query)
    request.query.debug = string2bool(request.query.debug);
    request.query.markdown = string2bool(request.query.markdown);
    request.query.direction = request.query.direction == "right" ? "right" : "left";
    request.query.text = request.query.text ?? "Text";
    request.query.name = request.query.name ?? "name";
    request.query.id = request.query.id ?? "id";
    request.query.color = request.query.color ?? "#fff";
    request.query.tcolor = request.query.tcolor ?? "#000";
    request.query.format = request.query.format ?? "png";
    const buffer = await generateImage(request.query as query);
    reply.type(getMIME(request.query.format)).send(buffer);
});

fastify.post("/", opts, async (request, reply) => {
    const buffer = await generateImage(request.body as query);
    reply.type(getMIME(request.body.format)).send(buffer);
});

function string2bool(str: string) {
    return str && Boolean(str.match(/^(true|1)$/i));
}

function getMIME(format: 'png' | 'jpeg' | 'webp' | 'tiff' | 'avif' | 'svg' | 'raw') {
    switch (format) {
        case "jpeg":
            return "image/jpeg";
        case "webp":
            return "image/webp";
        case "tiff":
            return "image/tiff";
        case "avif":
            return "image/avif";
        case "svg":
            return "image/svg+xml";
        case "raw":
            return "application/octet-stream";
        default://png
            return "image/png";
    }
}