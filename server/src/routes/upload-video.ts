import path from "node:path";
import fs from "node:fs";
import { promisify } from "node:util";
import { pipeline } from "node:stream";
import { randomUUID as uuid } from "node:crypto";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { fastifyMultipart } from "@fastify/multipart";
import { client } from "../lib/prisma";

const pump = promisify(pipeline);

export async function uploadVideo(app: FastifyInstance) {
  app.register(fastifyMultipart, {
    limits: {
      fileSize: 1048576 * 25, // 25mb
    },
  });

  app.post("/videos", async (req: FastifyRequest, rep: FastifyReply) => {
    const data = await req.file();
    if (!data) {
      return rep.status(400).send({ error: "missing file input." });
    }

    const ext = path.extname(data.filename);
    if (ext !== ".mp3") {
      return rep
        .status(400)
        .send({ error: "invalid input type, please upload a mp3" });
    }

    const fileBaseName = path.basename(data.filename, ext);
    const fileUploadName = `${fileBaseName}-${uuid()}${ext}`;

    const uploadDestination = path.resolve(
      __dirname,
      "../../tmp",
      fileUploadName
    );

    await pump(data.file, fs.createWriteStream(uploadDestination));

    const video = await client.video.create({
      data: {
        name: data.filename,
        path: uploadDestination,
      },
    });

    return rep.status(200).send(video);
  });
}
