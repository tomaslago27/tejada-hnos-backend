import { DataSource } from 'typeorm';
import { ENV } from "@config/environment";

/**
 * MySQL DataSource configuration using TypeORM.
 * @requires MYSQL_HOST, MYSQL_PORT, MYSQL_USERNAME, MYSQL_PASSWORD, MYSQL_DATABASE environment variables.
 */
export const MySQLDataSource = new DataSource({
    type: 'mysql',
    host: ENV.MYSQL_HOST,
    port: +ENV.MYSQL_PORT,
    username: ENV.MYSQL_USERNAME,
    password: ENV.MYSQL_PASSWORD,
    database: ENV.MYSQL_DATABASE,
    entities: ['src/models/sql/**/*.model.{ts,js}'],
    synchronize: true, // Set to false in production
    logging: true,
});
