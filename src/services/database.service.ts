import { MySQLDataSource } from '@config/typeorm.config';
import { connectToMongoDB } from '@config/mongoose.config';

export class DatabaseService {
    /**
     * Initialize connections to both MySQL and MongoDB databases.
     * Exits the process if any connection fails.
     * @returns {Promise<void>}
     */
    static async initializeConnections(): Promise<void> {
        try {
            // Initialize MySQL connection
            await MySQLDataSource.initialize();
            console.log('MySQL Database connection initialized');

            // Initialize MongoDB connection
            await connectToMongoDB();
            console.log('All database connections established successfully');
        } catch (error) {
            console.error('Error during database initialization:', error);
            process.exit(1);
        }
    }
}
