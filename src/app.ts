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
import { FromSchema } from "json-schema-to-ts";
import { render } from "./render";

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

const ValidationSchema = {
    type: "object",
    required: ["text", "name", "id"],
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
            enum: ["png", "jpeg", "webp", "tiff", "avif", "svg", "raw"],
            default: "png"
        }
    },
    additionalProperties: false
} as const;

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

fastify.post<{ Body: FromSchema<typeof ValidationSchema> }>(
    "/",
    opts,
    async (request, reply) => {
        const buffer = await render(request.body);
        reply.type(getMIME(request.body.format)).send(buffer);
    }
);

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
