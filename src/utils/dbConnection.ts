
/**
 * Database connection utility for PostgreSQL
 */

// Connection parameters for PostgreSQL database
export const dbParams = {
  host: 'localhost',
  port: 5434,
  dbname: 'postgres', // default DB unless you created a custom one
  user: 'postgres',
  password: 'password' // the one you set in -e POSTGRES_PASSWORD=password
};

/**
 * Creates a PostgreSQL connection string from the database parameters
 * @returns The connection string for the database
 */
export const getConnectionString = (): string => {
  const { host, port, dbname, user, password } = dbParams;
  return `postgresql://${user}:${password}@${host}:${port}/${dbname}`;
};

/**
 * Tests if the database connection is working
 * @returns Promise resolving to true if connected, or error message if failed
 */
export const testConnection = async (): Promise<boolean | string> => {
  try {
    // Using Supabase only for testing the connection
    // This doesn't rely on the Supabase project, just uses the client
    // to test the direct PostgreSQL connection
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase.rpc('pg_database_size', {
      dbname: dbParams.dbname
    });
    
    if (error) throw error;
    
    console.log('Successfully connected to the database');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return String(error);
  }
};

/**
 * Example usage in your application:
 * 
 * import { testConnection, getConnectionString } from '@/utils/dbConnection';
 * 
 * // Test if the connection works
 * const connectionTest = await testConnection();
 * if (connectionTest === true) {
 *   console.log('Connected to database');
 * } else {
 *   console.error('Failed to connect:', connectionTest);
 * }
 * 
 * // Get connection string for use with a PostgreSQL client
 * const connectionString = getConnectionString();
 */
