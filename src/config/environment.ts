import dotenv from "dotenv";

dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET || "default_jwt_secret",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "default_jwt_refresh_secret",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "15m", // Token de acceso corto
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "12h", // Token de refresh más largo pero no más de 12h
  POSTGRES_HOST: process.env.POSTGRES_HOST || "localhost",
  POSTGRES_PORT: process.env.POSTGRES_PORT || "5432",
  POSTGRES_USERNAME: process.env.POSTGRES_USERNAME || "postgres",
  POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD || "",
  POSTGRES_DATABASE: process.env.POSTGRES_DATABASE || "tejada_hnos",
};
