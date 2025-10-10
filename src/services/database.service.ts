import { DataSource } from "typeorm";
import { PostgreSQLDataSource } from "@config/typeorm.config";

export class DatabaseService {
  private static dataSource: DataSource;

  /**
   * Initializes the main data source.
   * @returns A promise that resolves with the initialized DataSource.
   */
  static async initialize(): Promise<DataSource> {
    try {
      this.dataSource = await PostgreSQLDataSource.initialize();
      console.log("🌿 Database connection established successfully.");
      return this.dataSource;
    } catch (error) {
      console.error("❌ Error connecting to the database:", error);
      throw error;
    }
  }

  /**
   * Get the PostgreSQL DataSource instance
   * @returns {DataSource}
   */
  static getDataSource(): DataSource {
    if (!this.dataSource || !this.dataSource.isInitialized) {
      throw new Error("Database connection is not initialized or has been lost.");
    }
    return this.dataSource;
  }
}
