import { createApp } from "./app";
import { env } from "./config/env";

const app = createApp();

app.listen(env.port, () => {
  console.log(`GestQuadra API rodando em http://localhost:${env.port}`);
});
