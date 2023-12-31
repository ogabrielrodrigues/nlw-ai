import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { client } from "../lib/prisma";
import { openai } from "../lib/openai";
import { streamToResponse, OpenAIStream } from "ai";

export async function generateAICompletion(app: FastifyInstance) {
  app.post("/ai/complete", async (req: FastifyRequest, rep: FastifyReply) => {
    const bodySchema = z.object({
      id: z.string().uuid(),
      prompt: z.string(),
      temperature: z.number().min(0).max(1).default(0.5),
    });

    const { id, prompt, temperature } = bodySchema.parse(req.body);

    const video = await client.video.findUniqueOrThrow({
      where: {
        id,
      },
    });

    if (!video.transcription) {
      return rep
        .status(400)
        .send({ error: "Video transcription not found..." });
    }

    const promptMessage = prompt.replace(
      "{transcription}",
      video.transcription
    );

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-16k",
      temperature,
      messages: [{ role: "user", content: promptMessage }],
      stream: true,
    });

    const stream = OpenAIStream(response);

    streamToResponse(stream, rep.raw, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
      },
    });
  });
}
