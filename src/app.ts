import opentype from 'opentype.js';
import { generateImage } from "./image";


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

fastify.get("*", async (request, reply) => {
    console.log(request.ips);
    console.log(request.query)
    const buffer = await generateImage(request.query as any);
    reply.type("image/jpeg").send(buffer);
});

fastify.post("*", async (request, reply) => {
    const buffer = await generateImage(request.body as any);
    reply.type("image/jpeg").send(buffer);
});