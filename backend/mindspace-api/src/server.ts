import { buildApp } from "./app.js";
import { config } from "./config.js";
import { prisma } from "./db.js";

const app = await buildApp();

try {
  await prisma.$connect();
  await app.listen({ host: config.host, port: config.port });
} catch (error) {
  app.log.error({ err: error }, "MindSpace API failed to start");
  await app.close();
  process.exitCode = 1;
}
