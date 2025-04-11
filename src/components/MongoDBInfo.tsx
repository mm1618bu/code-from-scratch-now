
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, AlertTriangle, Server, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const MOCK_DOCUMENTS = [
  { _id: '507f1f77bcf86cd799439011', name: 'Product A', category: 'Electronics', price: 499.99 },
  { _id: '507f1f77bcf86cd799439012', name: 'Product B', category: 'Books', price: 29.99 },
  { _id: '507f1f77bcf86cd799439013', name: 'Product C', category: 'Home & Kitchen', price: 149.99 },
  { _id: '507f1f77bcf86cd799439014', name: 'Product D', category: 'Electronics', price: 899.99 },
  { _id: '507f1f77bcf86cd799439015', name: 'Product E', category: 'Clothing', price: 59.99 },
];

const MongoDBInfo: React.FC = () => {
  const { toast } = useToast();
  const [showData, setShowData] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConnectDemo = () => {
    setLoading(true);
    
    // Simulate connection delay
    setTimeout(() => {
      setLoading(false);
      setShowData(true);
      toast({
        title: "MongoDB Demo Connected",
        description: "Successfully connected to mock MongoDB database",
      });
    }, 1500);
  };

  const handleRefresh = () => {
    setLoading(true);
    
    // Simulate refresh delay
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Data Refreshed",
        description: "Mock MongoDB data has been refreshed",
      });
    }, 800);
  };

  return (
    <div className="text-white">
      <div className="mb-6 p-4 bg-amber-500/20 border border-amber-500/50 rounded-lg">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-amber-400">Browser Environment Notice</h3>
            <p className="text-gray-300 mt-1 text-sm">
              The MongoDB Node.js driver cannot be used directly in a browser environment. 
              In a production application, you would need to:
            </p>
            <ul className="list-disc ml-5 mt-2 text-sm text-gray-300 space-y-1">
              <li>Create a backend API service (using Node.js/Express)</li>
              <li>Setup MongoDB connection in your backend</li>
              <li>Create API endpoints to interact with MongoDB</li>
              <li>Call those API endpoints from your React frontend</li>
            </ul>
            <p className="text-gray-300 mt-2 text-sm">
              For demonstration purposes, we're showing a simulated MongoDB UI below.
            </p>
          </div>
        </div>
      </div>

      {!showData ? (
        <div className="text-center p-8 bg-dark-foreground/5 rounded-lg border border-dark-foreground/10">
          <Server className="h-12 w-12 mx-auto mb-3 text-sage/70" />
          <h2 className="text-xl font-medium mb-2">Connect to MongoDB Demo</h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Click the button below to simulate a connection to a MongoDB database.
          </p>
          <Button 
            onClick={handleConnectDemo}
            className="bg-sage hover:bg-sage/90"
            disabled={loading}
          >
            {loading ? "Connecting..." : "Connect to Demo Database"}
          </Button>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <Database className="h-5 w-5 mr-2 text-sage" />
              <h2 className="text-xl font-bold">MongoDB Demo Database</h2>
            </div>
            <div className="flex items-center">
              <div className="flex items-center mr-4">
                <div className="h-2 w-2 rounded-full bg-green-500 mr-1.5"></div>
                <span className="text-green-400 text-sm">Connected</span>
              </div>
              <Button 
                onClick={handleRefresh} 
                variant="outline" 
                size="sm"
                disabled={loading}
                className="border-sage text-sage hover:bg-sage/20"
              >
                {loading ? "Refreshing..." : "Refresh Data"}
              </Button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-dark-foreground/20 border-b border-dark-foreground/30">
                  <th className="py-2 px-4 text-left text-gray-400 font-medium">Document ID</th>
                  <th className="py-2 px-4 text-left text-gray-400 font-medium">Name</th>
                  <th className="py-2 px-4 text-left text-gray-400 font-medium">Category</th>
                  <th className="py-2 px-4 text-left text-gray-400 font-medium">Price</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_DOCUMENTS.map((doc) => (
                  <tr key={doc._id} className="border-b border-dark-foreground/10 hover:bg-dark-foreground/5">
                    <td className="py-3 px-4 text-sm text-gray-300 font-mono">{doc._id}</td>
                    <td className="py-3 px-4">{doc.name}</td>
                    <td className="py-3 px-4 text-gray-400">{doc.category}</td>
                    <td className="py-3 px-4">${doc.price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 p-4 bg-dark-foreground/10 rounded-lg text-sm text-gray-400">
            <p className="flex items-center">
              <Check className="h-4 w-4 text-green-500 mr-2" />
              <span>This is a simulated MongoDB interface for demonstration purposes.</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MongoDBInfo;
