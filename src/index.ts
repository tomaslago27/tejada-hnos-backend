import "reflect-metadata";
import express from "express";
import cors from "cors";
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { ENV } from "@config/environment";
import { DatabaseService } from "@services/database.service";
import { errorHandler } from "@middlewares/error-handler.middleware";

// Forzar zona horaria UTC para todo el proceso de Node.js
process.env.TZ = 'UTC';

// Importar las funciones creadoras de rutas
import { createAuthRoutes } from "@routes/auth.routes";
import { createUserRoutes } from "@routes/user.routes";
import { createFieldRoutes } from "@routes/field.routes";
import { createPlotRoutes } from "@routes/plot.routes";
import { createActivityRoutes } from "@/routes/activity.routes";
import { createWorkOrderRoutes } from "./routes/work-order.routes";
import { createHarvestLotRoutes } from "@routes/harvest-lot.routes";
import { createCustomerRoutes } from "@/routes/customer.routes";
import { createSupplierRoutes } from "@/routes/supplier.routes";
import { createVarietyRoutes } from "./routes/variety.routes";
import { createPurchaseOrderRoutes } from "@routes/purchase-order.routes";
import { createInputRoutes } from "@routes/input.routes";
import { createGoodsReceiptRoutes } from "@routes/goods-receipt.routes";
import { createSalesOrderRoutes } from "@routes/sale-order.routes";
import { createShipmentRoutes } from "@routes/shipment.routes";
import { createTraceRoutes } from "@routes/trace.routes";
import { createReportRoutes } from "@routes/report.routes";

const startServer = async () => {
  try {
    // 1. Inicializar la conexión a la base de datos y obtener el dataSource
    const dataSource = await DatabaseService.initialize();
    const app = express();

    const isProd = ENV.NODE_ENV === 'production';

    // 2. Configurar Middlewares
    if (isProd) {
      app.use(helmet());
      app.set('trust proxy', 1);
      app.use(rateLimit({ windowMs: 60_000, max: 100 }));
      const origin = ENV.CORS_ORIGIN || undefined;
      app.use(cors(origin ? { origin } : {}));
    } else {
      app.use(cors());
    }

    app.use(express.json());
    
    // Middleware para serializar fechas consistentemente en UTC (opcional)
    // Descomenta la siguiente línea si quieres forzar que todas las respuestas 
    // conviertan Date objects a ISO strings automáticamente
    // import { dateSerializerMiddleware } from "@middlewares/date-serializer.middleware";
    // app.use(dateSerializerMiddleware);
      
    // 3. Configurar Rutas, inyectando el dataSource
    app.use("/auth", createAuthRoutes(dataSource));
    app.use("/users", createUserRoutes(dataSource));
    app.use("/fields", createFieldRoutes(dataSource));
    app.use("/plots", createPlotRoutes(dataSource));
    app.use("/work-orders", createWorkOrderRoutes(dataSource));
    app.use("/activities", createActivityRoutes(dataSource));
    app.use("/harvest-lots", createHarvestLotRoutes(dataSource));
    app.use("/customers", createCustomerRoutes(dataSource));
    app.use("/suppliers", createSupplierRoutes(dataSource));
    app.use("/varieties", createVarietyRoutes(dataSource));
    app.use("/purchase-orders", createPurchaseOrderRoutes(dataSource));
    app.use("/inputs", createInputRoutes(dataSource));
    app.use("/goods-receipts", createGoodsReceiptRoutes(dataSource));
    app.use("/sale-orders", createSalesOrderRoutes(dataSource));
    app.use("/shipments", createShipmentRoutes(dataSource));
    app.use("/trace", createTraceRoutes(dataSource));
    app.use("/reports", createReportRoutes(dataSource));

    // 4. Configurar Error Handler (al final)
    app.use(errorHandler);

    // health endpoints
    app.get('/health', (_req, res) => res.status(200).send({ status: 'ok' }));
    app.get('/ready', (_req, res) => {
      try {
        const ds = DatabaseService.getDataSource();
        return res.status(200).send({ ready: ds.isInitialized });
      } catch (e) {
        return res.status(503).send({ ready: false });
      }
    });

    // 5. Iniciar el servidor
    const server = app.listen(ENV.PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${ENV.PORT}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`Received ${signal}. Shutting down gracefully...`);
      try {
        await DatabaseService.shutdown();
      } catch (e) {
        console.warn('Error during database shutdown:', e);
      }
      server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });
      // Force exit after 10s
      setTimeout(() => {
        console.error('Forcing shutdown.');
        process.exit(1);
      }, 10_000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error("❌ Error initializing the application:", error);
    process.exit(1);
  }
};

startServer();
