import { DataSource } from 'typeorm';
import { ENV } from "@config/environment";

/**
 * PostgreSQL DataSource configuration using TypeORM.
 * @requires POSTGRES_HOST, POSTGRES_PORT, POSTGRES_USERNAME, POSTGRES_PASSWORD, POSTGRES_DATABASE environment variables.
 */
export const PostgreSQLDataSource = new DataSource({
    type: 'postgres',
    host: ENV.POSTGRES_HOST,
    port: +ENV.POSTGRES_PORT,
    username: ENV.POSTGRES_USERNAME,
    password: ENV.POSTGRES_PASSWORD,
    database: ENV.POSTGRES_DATABASE,
    entities: ["src/entities/*.ts"],
    synchronize: true, // Set to false in production
    logging: true,
});
