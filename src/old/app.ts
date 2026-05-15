import cors from "@fastify/cors";
import Fastify, {
    FastifyBaseLogger,
    FastifySchema,
    FastifyTypeProviderDefault,
    RawServerDefault,
    RouteGenericInterface,
    RouteShorthandOptions
} from "fastify";
import { IncomingMessage, ServerResponse } from "http";
import opentype from "opentype.js";
import { generateImage, query } from "./image";

const fastify = Fastify({ logger: true, trustProxy: true });

fastify.register(cors, {
    // 全てのオリジンからのリクエストを許可
    origin: "*"
});
const port = Number(process.env.PORT) || 3000;
fastify.listen({ port, host: "0.0.0.0" }, (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Server    is    running    at    ${address}`);
});

global.fonts = {
    "SourGummy-Thin": null,
    "PopGothicCjkJp-Bold": null,
    "NotoSansCanadianAboriginal-Bold": null,
    "NotoSansJP-Medium": null,
    "NotoSansKR-Medium": null,
    "NotoSansSC-Medium": null,
    "NotoSansMath-Regular": null
};
for (const key in global.fonts) {
    const e = global.fonts[key] ?? "ttf";
    global.fonts[key] = opentype.loadSync(`./assets/${key}.${e}`);

    console.log(key);
}

const ValidationSchema = {
    type: "object",
    required: ["text", "name", "id"],
    properties: {
        text: { type: "string" },
        icon: { type: "string" },
        name: { type: "string" },
        id: { type: "string" },
        debug: { type: "boolean" },
        markdown: { type: "boolean" },
        direction: { type: "string", enum: ["left", "right"] },
        color: { type: "string" },
        tcolor: { type: "string" },
        format: {
            type: "string",
            enum: ["png", "jpeg", "webp", "tiff", "avif", "svg", "raw"]
        }
    }
};

const opts: RouteShorthandOptions<
    RawServerDefault,
    IncomingMessage,
    ServerResponse<IncomingMessage>,
    RouteGenericInterface,
    unknown,
    FastifySchema,
    FastifyTypeProviderDefault,
    FastifyBaseLogger
> = {
    schema: {
        body: ValidationSchema
    }
};

fastify.get(
    "/",
    {
        schema: {
            querystring: {
                type: "object",
                properties: {
                    debug: {
                        type: "boolean",
                        default: false
                    },
                    markdown: {
                        type: "boolean",
                        default: false
                    },
                    direction: {
                        type: "string",
                        enum: ["left", "right"],
                        default: "left"
                    },
                    text: {
                        type: "string",
                        default: "Text"
                    },
                    name: {
                        type: "string",
                        default: "name"
                    },
                    id: {
                        type: "string",
                        default: "id"
                    },
                    color: {
                        type: "string",
                        default: "#fff",
                        pattern: "^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$"
                    },
                    tcolor: {
                        type: "string",
                        default: "#000",
                        pattern: "^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$"
                    },
                    format: {
                        type: "string",
                        enum: [
                            "png",
                            "jpeg",
                            "webp",
                            "tiff",
                            "avif",
                            "svg",
                            "raw"
                        ],
                        default: "png"
                    }
                },
                additionalProperties: false
            }
        }
    },
    async (request, reply) => {
        console.log(request.ips);
        console.log(request.query);
        const buffer = await generateImage(request.query as query);
        reply.type(getMIME(request.query.format)).send(buffer);
    }
);

fastify.post("/", opts, async (request, reply) => {
    const buffer = await generateImage(request.body as query);
    reply.type(getMIME(request.body.format)).send(buffer);
});

function string2bool(str: string) {
    return str && Boolean(str.match(/^(true|1)$/i));
}

function getMIME(
    format: "png" | "jpeg" | "webp" | "tiff" | "avif" | "svg" | "raw"
) {
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
        default: //png
            return "image/png";
    }
}
