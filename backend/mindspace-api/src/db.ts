import { PrismaClient } from "@prisma/client";
import { config } from "./config.js";

export const prisma = new PrismaClient({
  log: config.environment === "development" ? ["warn", "error"] : ["error"],
  datasources: {
    db: { url: config.databaseUrl },
  },
});
