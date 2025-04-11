
import { MongoClient, ServerApiVersion } from 'mongodb';

// Replace the connection string with your MongoDB connection string
const uri = "YOUR_MONGODB_CONNECTION_STRING";

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

  // Connect to MongoDB
  await client.connect();
  console.log("Connected to MongoDB");
  
  // Get the database
  const db = client.db(dbName);
  
  // Cache the connection
  cachedClient = client;
  cachedDb = db;
  
  return { client, db };
}

// Example usage:
// const { db } = await connectToDatabase('your-database-name');
// const collection = db.collection('your-collection-name');
// const documents = await collection.find({}).toArray();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  if (cachedClient) {
    console.log('Closing MongoDB connection');
    await cachedClient.close();
    process.exit(0);
  }
});
