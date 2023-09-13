import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { client } from "../lib/prisma";
import { createReadStream } from "fs";
import { openai } from "../lib/openai";

export async function createTranscription(app: FastifyInstance) {
  app.post(
    "/videos/:id/transcription",
    async (req: FastifyRequest, rep: FastifyReply) => {
      const paramsSchema = z.object({
        id: z.string().uuid(),
      });

      const { id } = paramsSchema.parse(req.params);

      const bodySchema = z.object({
        prompt: z.string(),
      });

      const { prompt } = bodySchema.parse(req.body);

      const video = await client.video.findUniqueOrThrow({
        where: {
          id,
        },
      });

      const audioReadStream = createReadStream(video.path);

      const response = await openai.audio.transcriptions.create({
        file: audioReadStream,
        model: "whisper-1",
        language: "pt",
        response_format: "json",
        temperature: 0,
        prompt,
      });

      const transcription = response.text;

      await client.video.update({
        where: {
          id,
        },
        data: {
          transcription,
        },
      });

      return transcription;
    }
  );
}
