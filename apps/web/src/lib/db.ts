import oracledb from 'oracledb';

interface DatabaseConfig {
  user: string;
  password: string;
  connectString: string;
  poolAlias?: string;
  poolMin?: number;
  poolMax?: number;
  poolIncrement?: number;
  poolTimeout?: number;
}

class DatabaseManager {
  private static instance: DatabaseManager;
  private isInitialized = false;
  private poolAlias = 'pcm_pool';

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    const config: DatabaseConfig = {
      user: process.env.DB_USER || 'pcm_user',
      password: process.env.DB_PASSWORD || 'pcm_password',
      connectString: process.env.DB_CONNECT_STRING || 'localhost:1521/xe',
      poolAlias: this.poolAlias,
      poolMin: 5,
      poolMax: 20,
      poolIncrement: 2,
      poolTimeout: 60000, // 60 seconds
    };

    try {
      await oracledb.createPool(config);
      this.isInitialized = true;
      console.log('Database connection pool created successfully');
    } catch (error) {
      console.error('Failed to create database connection pool:', error);
      throw error;
    }
  }

  public async getConnection(): Promise<oracledb.Connection> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      return await oracledb.getConnection(this.poolAlias);
    } catch (error) {
      console.error('Failed to get database connection:', error);
      throw error;
    }
  }

  public async executeQuery<T = any>(
    sql: string,
    binds: any[] = [],
    options: oracledb.ExecuteOptions = {}
  ): Promise<oracledb.Result<T>> {
    let connection: oracledb.Connection | null = null;

    try {
      connection = await this.getConnection();
      const result = await connection.execute(sql, binds, {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
        autoCommit: true,
        ...options,
      });
      return result;
    } catch (error) {
      console.error('Database query execution failed:', error);
      throw error;
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (closeError) {
          console.error('Failed to close database connection:', closeError);
        }
      }
    }
  }

  public async executeTransaction(
    operations: (connection: oracledb.Connection) => Promise<void>
  ): Promise<void> {
    let connection: oracledb.Connection | null = null;

    try {
      connection = await this.getConnection();
      await operations(connection);
      await connection.commit();
    } catch (error) {
      if (connection) {
        try {
          await connection.rollback();
        } catch (rollbackError) {
          console.error('Failed to rollback transaction:', rollbackError);
        }
      }
      throw error;
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (closeError) {
          console.error('Failed to close database connection:', closeError);
        }
      }
    }
  }

  public async checkHealth(): Promise<boolean> {
    try {
      const result = await this.executeQuery('SELECT 1 FROM DUAL');
      return result.rows && result.rows.length > 0;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  public async close(): Promise<void> {
    try {
      await oracledb.getPool(this.poolAlias).close();
      this.isInitialized = false;
      console.log('Database connection pool closed');
    } catch (error) {
      console.error('Failed to close database connection pool:', error);
      throw error;
    }
  }
}

export const db = DatabaseManager.getInstance();
export default db;