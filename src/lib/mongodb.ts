
// NOTE: This file is for reference only and won't be used directly in the browser.
// MongoDB Node.js driver is not compatible with browser environments.
// In a real application, you would have a backend service with this code.

import { MongoClient, ServerApiVersion } from 'mongodb';

// Using a placeholder connection string (in a real app, use environment variables)
const uri = "mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority";

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

// In a real application with a backend service, you would create API endpoints like:
/*
app.get('/api/documents', async (req, res) => {
  try {
    const { db } = await connectToDatabase('your_database_name');
    const collection = db.collection('your_collection_name');
    const documents = await collection.find({}).limit(10).toArray();
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});
*/
