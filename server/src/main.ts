import "dotenv/config";
import { fastify } from "fastify";
import { fastifyCors } from "@fastify/cors";
import { findAllPrompts } from "./routes/find-all-prompts";
import { uploadVideo } from "./routes/upload-video";
import { createTranscription } from "./routes/create-transcription";
import { generateAICompletion } from "./routes/generate-ai-completion";

const port = (process.env.PORT ?? 3333).toString();

const app = fastify();
app.register(fastifyCors, {
  origin: "*",
});
app.register(findAllPrompts);
app.register(uploadVideo);
app.register(createTranscription);
app.register(generateAICompletion);

app
  .listen({
    port: parseInt(port),
  })
  .then(() => {
    console.log("server running on :%s", port);
  });
