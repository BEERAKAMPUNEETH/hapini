import app from "./app";
import { env } from "./config/env";
import { checkDatabaseConnection } from "./config/db";
import { runMigrations } from "./database/migrator";
import { runSeeds } from "./database/seeder";

import { alertJobService } from "./services/alertJob.service";

async function bootstrap() {
  console.log(` Starting Hapini Backend Server in ${env.NODE_ENV} mode...`);

  // Check database connectivity and auto-sync schema if connected
  const connected = await checkDatabaseConnection().catch((err) => {
    console.warn("⚠️ Initial database check warning:", err.message);
    return false;
  });

  if (!connected && env.DB_REQUIRED) {
    console.error(`❌ FATAL: Database connection failed and DB_REQUIRED=true. Halting server startup (PostgreSQL persistence required).`);
    process.exit(1);
  }

  if (connected) {
    try {
      await runMigrations();
      await runSeeds();
    } catch (dbErr: any) {
      console.warn("⚠️ Database auto-migration notice:", dbErr.message);
    }
  }

  const server = app.listen(env.PORT, () => {
    console.log(` Hapini Backend Server running on http://localhost:${env.PORT}`);
    console.log(` Health check available at http://localhost:${env.PORT}/api/health`);
    console.log(` Products API available at http://localhost:${env.PORT}/api/products`);
  });

  // Start background price alert checking job
  alertJobService.startScheduler(60000);

  // Graceful shutdown handling
  const shutdown = () => {
    console.log(" Gracefully shutting down Hapini Backend...");
    alertJobService.stopScheduler();
    server.close(() => {
      console.log(" HTTP server closed.");
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

bootstrap().catch((err) => {
  console.error("❌ Fatal startup error:", err);
  process.exit(1);
});
