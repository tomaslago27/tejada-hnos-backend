import express from "express";
import { ENV } from "./config/environment";
import usersRoutes from "./routes/user.routes"; // TO-DO: Remove this example route

const app = express();

// Middlewares
app.use(express.json());

// Rutas
app.use("/users", usersRoutes); // TO-DO: Remove this example route

app.listen(ENV.PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${ENV.PORT}`);
});
