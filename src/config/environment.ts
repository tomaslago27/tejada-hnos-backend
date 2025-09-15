import dotenv from "dotenv";

dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 3000,
  DATABASE_URL: process.env.DATABASE_URL || "mongodb://localhost:27017/default_db",
  JWT_SECRET: process.env.JWT_SECRET || "default_jwt_secret",
};
