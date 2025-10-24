import "reflect-metadata";
import express from "express";
import cors from "cors";
import { ENV } from "@config/environment";
import { DatabaseService } from "@services/database.service";
import { errorHandler } from "@middlewares/error-handler.middleware";

// Importar las funciones creadoras de rutas
import { createAuthRoutes } from "@routes/auth.routes";
import { createUserRoutes } from "@routes/user.routes";
import { createFieldRoutes } from "@routes/field.routes";
import { createPlotRoutes } from "@routes/plot.routes";
import { createActivityLogRoutes } from "@routes/activity-log.routes";

const startServer = async () => {
  try {
    // 1. Inicializar la conexión a la base de datos y obtener el dataSource
    const dataSource = await DatabaseService.initialize();
    const app = express();

    // 2. Configurar Middlewares
    app.use(cors());
    app.use(express.json());

    // 3. Configurar Rutas, inyectando el dataSource
    app.use("/auth", createAuthRoutes(dataSource));
    app.use("/users", createUserRoutes(dataSource));
    app.use("/fields", createFieldRoutes(dataSource));
    app.use("/plots", createPlotRoutes(dataSource));
    app.use("/activity-logs", createActivityLogRoutes(dataSource));

    // 4. Configurar Error Handler (al final)
    app.use(errorHandler);

    // 5. Iniciar el servidor
    app.listen(ENV.PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${ENV.PORT}`);
    });

  } catch (error) {
    console.error("❌ Error initializing the application:", error);
    process.exit(1);
  }
};

startServer();
