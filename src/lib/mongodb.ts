
import { MongoClient, ServerApiVersion } from 'mongodb';

// Using a real connection string from the user
const uri = "mongodb+srv://user:password@cluster0.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Cached connection
let cachedClient: MongoClient | null = null;
let cachedDb: any = null;

export async function connectToDatabase(dbName: string) {
  // If we have a cached connection, use it
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB");
    
    // Get the database
    const db = client.db(dbName);
    
    // Cache the connection
    cachedClient = client;
    cachedDb = db;
    
    return { client, db };
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw new Error("Failed to connect to MongoDB");
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  if (cachedClient) {
    console.log('Closing MongoDB connection');
    await cachedClient.close();
    process.exit(0);
  }
});
