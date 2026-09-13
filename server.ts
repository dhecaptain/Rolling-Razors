import { env } from "./server/env";
import { logger } from "./server/logger";
import { prisma } from "./server/prisma";
import { createApp } from "./server/app";

async function startServer(){
  const app = await createApp({ serveStatic: true });
  const server = app.listen(env.PORT, "0.0.0.0", () => {
    logger.info(`Rolling Razors Customs Full-Stack Server running on port ${env.PORT} [${env.NODE_ENV}] with ${process.env.DATABASE_ENGINE === "postgres" ? "Postgres" : "JSON mock"}`);
  });
  const shutdown=async()=>{ logger.info("Shutting down..."); await prisma.$disconnect().catch(()=>{}); server.close(()=>process.exit(0)); };
  process.on("SIGTERM", shutdown); process.on("SIGINT", shutdown);
}
startServer();