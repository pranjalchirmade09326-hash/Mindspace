import { buildApp } from "./app.js";
import { config } from "./config.js";
import { prisma } from "./db.js";

const app = await buildApp();

try {
  try {
    await prisma.$connect();
    app.log.info("Database connected successfully");
  } catch (dbError) {
    app.log.warn({ err: dbError }, "Database not reachable yet. API and Swagger are running; start PostgreSQL on port 5433 for DB requests.");
  }
  await app.listen({ host: config.host, port: config.port });
  console.log(`\n🚀 MindSpace API server running at http://localhost:${config.port}`);
  console.log(`📚 Swagger API Docs: http://localhost:${config.port}/api-docs\n`);
} catch (error) {
  app.log.error({ err: error }, "MindSpace API failed to start");
  await app.close();
  process.exitCode = 1;
}
