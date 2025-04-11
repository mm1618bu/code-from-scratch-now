
import React, { useState, useEffect } from 'react';
import { connectToDatabase } from '@/lib/mongodb';

interface MongoDocument {
  _id: string;
  name: string;
  // Add other fields you expect from your MongoDB documents
}

const MongoExample: React.FC = () => {
  const [documents, setDocuments] = useState<MongoDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Replace with your MongoDB connection details
        const { db } = await connectToDatabase('your-database-name');
        const collection = db.collection('your-collection-name');
        
        // Fetch documents from MongoDB
        const result = await collection.find({}).limit(10).toArray();
        setDocuments(result as MongoDocument[]);
      } catch (err) {
        console.error('Error fetching from MongoDB:', err);
        setError('Failed to fetch data from MongoDB. Please check your connection string.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) return <div>Loading data from MongoDB...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Data from MongoDB</h2>
      {documents.length === 0 ? (
        <p>No documents found in MongoDB.</p>
      ) : (
        <ul className="space-y-2">
          {documents.map((doc) => (
            <li key={doc._id} className="p-2 border rounded">
              {doc.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MongoExample;
