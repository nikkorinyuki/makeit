import opentype from 'opentype.js';
import { generateImage, query } from "./image";
import { FastifyBaseLogger, FastifySchema, FastifyTypeProviderDefault, RawServerDefault, RouteGenericInterface, RouteShorthandOptions } from 'fastify';
import { IncomingMessage, ServerResponse } from 'http';


const fastify = require("fastify")({ logger: true, trustProxy: true });
const port = Number(process.env.PORT) || 3001;
fastify.listen({ port, host: "0.0.0.0" }, (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Server    is    running    at    ${address}`);
});

global.fonts = {
    "emoji": null,
    "note_ja": null,
    "note_ja_bold": null,
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
    required: [],
    properties: {
        text: { type: 'string' },
        icon: { type: 'string' },
        name: { type: 'string' },
        id: { type: 'string' },
        debug: { type: "boolean" },
        markdown: { type: "boolean" },
        direction: { type: 'string', enum: ['left', 'right'] },
        color: { type: 'string' }
    }
};

const opts: RouteShorthandOptions<RawServerDefault, IncomingMessage, ServerResponse<IncomingMessage>, RouteGenericInterface, unknown, FastifySchema, FastifyTypeProviderDefault, FastifyBaseLogger> = {
    schema: {
        body: ValidationSchema
    }
}

fastify.get("*", async (request, reply) => {
    console.log(request.ips);
    console.log(request.query)
    request.query.debug = string2bool(request.query.debug);
    request.query.markdown = string2bool(request.query.markdown);
    request.query.direction = request.query.direction == "right" ? "right" : "left";
    const buffer = await generateImage(request.query as query);
    reply.type("image/jpeg").send(buffer);
});

fastify.post("*", opts, async (request, reply) => {
    const buffer = await generateImage(request.body as query);
    reply.type("image/jpeg").send(buffer);
});

function string2bool(str: string) {
    return str && Boolean(str.match(/^(true|1)$/i));
}