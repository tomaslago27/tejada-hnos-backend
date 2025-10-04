import mongoose from 'mongoose';
import { ENV } from "@config/environment";

/**
 * Connect to MongoDB using Mongoose.
 * @requires MONGODB_URI environment variable with the connection string.
 * @throws Will throw an error if the connection fails.
 */
export const connectToMongoDB = async () => {
    try {
        await mongoose.connect(ENV.MONGODB_URI);
        console.log('Successfully connected to MongoDB.');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
};
