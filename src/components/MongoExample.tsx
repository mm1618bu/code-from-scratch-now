
import React, { useState, useEffect } from 'react';
import { connectToDatabase } from '@/lib/mongodb';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MongoDocument {
  _id: string;
  name: string;
  // Add other fields you expect from your MongoDB documents
}

const MongoExample: React.FC = () => {
  const [documents, setDocuments] = useState<MongoDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Connect to your actual database and collection
      const { db } = await connectToDatabase('sample_database');
      const collection = db.collection('sample_collection');
      
      // Fetch documents from MongoDB
      const result = await collection.find({}).limit(10).toArray();
      console.log("MongoDB data fetched:", result);
      setDocuments(result as MongoDocument[]);
    } catch (err) {
      console.error('Error fetching from MongoDB:', err);
      setError('Failed to fetch data from MongoDB. Please check your connection string.');
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRetry = () => {
    setRetrying(true);
    fetchData();
  };

  if (loading) return (
    <div className="flex justify-center items-center p-8">
      <Loader2 className="h-8 w-8 text-sage animate-spin mr-2" />
      <span className="text-white">Loading data from MongoDB...</span>
    </div>
  );

  if (error) return (
    <div className="p-4 bg-red-500/20 border border-red-500 rounded-lg">
      <h3 className="text-red-400 font-medium mb-2">Error</h3>
      <p className="text-white mb-4">{error}</p>
      <Button 
        onClick={handleRetry} 
        variant="secondary" 
        disabled={retrying}
        className="bg-red-500/20 hover:bg-red-500/30 border border-red-500"
      >
        {retrying ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Retrying...
          </>
        ) : 'Retry Connection'}
      </Button>
    </div>
  );

  return (
    <div className="text-white">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Data from MongoDB</h2>
        <Button 
          onClick={handleRetry} 
          variant="outline" 
          size="sm" 
          disabled={retrying}
          className="border-sage text-sage hover:bg-sage/20"
        >
          {retrying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : 'Refresh Data'}
        </Button>
      </div>
      
      {documents.length === 0 ? (
        <div className="bg-dark-foreground/20 p-6 rounded-lg text-center">
          <p className="text-gray-400">No documents found in MongoDB.</p>
          <p className="text-sm text-gray-500 mt-2">
            Make sure your database and collection exist and contain documents.
          </p>
        </div>
      ) : (
        <ul className="space-y-2 bg-dark-foreground/10 rounded-lg divide-y divide-gray-700">
          {documents.map((doc) => (
            <li key={doc._id.toString()} className="p-4">
              <div className="font-medium">{doc.name || "Unnamed Document"}</div>
              <div className="text-xs text-gray-400 mt-1">ID: {doc._id.toString()}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MongoExample;
