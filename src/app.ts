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
import { ExportFormat } from "skia-canvas";
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
    properties: {
        debug: {
            type: "boolean",
            default: false
        },
        markdown: {
            type: "boolean",
            default: true
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
            default: "#fff"
        },
        tcolor: {
            type: "string",
            default: "#000"
        },
        format: {
            type: "string",
            enum: ["png", "jpg", "jpeg", "webp", "raw", "pdf", "svg"],
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
        const abortController = new AbortController();
        const { signal } = abortController;
        request.raw.on("close", () => {
            abortController.abort();
        });
        const buffer = await render(request.body, signal);
        reply.type(getMIME(request.body.format)).send(buffer);
    }
);

function getMIME(format: ExportFormat) {
    switch (format) {
        case "png":
            return "image/png";
        case "jpg":
        case "jpeg":
            return "image/jpeg";
        case "webp":
            return "image/webp";
        case "raw":
            return "application/octet-stream";
        case "pdf":
            return "application/pdf";
        case "svg":
            return "image/svg+xml";
    }
}
