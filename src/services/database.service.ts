import { PostgreSQLDataSource } from '@config/typeorm.config';

export class DatabaseService {
    /**
     * Initialize connection to PostgreSQL database.
     * Exits the process if the connection fails.
     * @returns {Promise<void>}
     */
    static async initializeConnections(): Promise<void> {
        try {
            // Initialize PostgreSQL connection
            await PostgreSQLDataSource.initialize();
            console.log('PostgreSQL Database connection initialized successfully');
        } catch (error) {
            console.error('Error during database initialization:', error);
            process.exit(1);
        }
    }
}
