import "reflect-metadata";
import express from "express";
import { ENV } from "@config/environment";
import usersRoutes from "@routes/user.routes"; // TO-DO: Remove this example route
import productRoutes from "@routes/product.routes";
import { DatabaseService } from "@services/database.service";

const app = express();

// Middlewares
app.use(express.json());

// Rutas
app.use("/users", usersRoutes); // TO-DO: Remove this example route
app.use("/products", productRoutes);

// Inicializar conexiones a bases de datos
DatabaseService.initializeConnections()
  .then(() => {
    app.listen(ENV.PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${ENV.PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error initializing the application:", error);
    process.exit(1);
  });
