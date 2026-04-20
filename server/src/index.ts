import { app } from "./app.js";
import { config } from "./config.js";
import { prisma } from "./lib/prisma.js";

async function bootstrap() {
  try {
    await prisma.$connect();
    app.listen(config.port, () => {
      console.log(`Server listening on http://localhost:${config.port}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
}

bootstrap();
