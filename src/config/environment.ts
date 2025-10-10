import dotenv from "dotenv";

dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET || "default_jwt_secret",
  POSTGRES_HOST: process.env.POSTGRES_HOST || "localhost",
  POSTGRES_PORT: process.env.POSTGRES_PORT || "5432",
  POSTGRES_USERNAME: process.env.POSTGRES_USERNAME || "postgres",
  POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD || "",
  POSTGRES_DATABASE: process.env.POSTGRES_DATABASE || "tejada_hnos",
};
