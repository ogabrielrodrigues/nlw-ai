import { FastifyInstance } from "fastify";
import { client } from "../lib/prisma";

export async function findAllPrompts(app: FastifyInstance) {
  app.get("/prompts", async () => {
    const prompts = await client.prompt.findMany();

    return prompts;
  });
}
