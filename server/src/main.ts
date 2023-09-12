import "dotenv/config";
import { fastify } from "fastify";

const app = fastify();

const port = (process.env.PORT ?? 3333).toString();

app.get("/", (req, rep) => {
  rep.status(200).send("Hello World");
});

app
  .listen({
    port: parseInt(port),
  })
  .then(() => {
    console.log("server running on :%s", port);
  });
