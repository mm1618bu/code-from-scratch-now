
import React, { useState, useEffect } from 'react';
import SageLogo from '@/components/SageLogo';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Database, RefreshCw, Table } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  Table as TableComponent,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

// Mock data - in a real application this would come from an API
const MOCK_LIVE_DATA = [
  { _id: '6071e8f68f25e32e7c9c5b01', name: 'John Doe', email: 'john@example.com', lastActive: '2025-04-10T14:30:00Z' },
  { _id: '6071e8f68f25e32e7c9c5b02', name: 'Jane Smith', email: 'jane@example.com', lastActive: '2025-04-11T09:15:00Z' },
  { _id: '6071e8f68f25e32e7c9c5b03', name: 'Bob Johnson', email: 'bob@example.com', lastActive: '2025-04-09T16:45:00Z' },
  { _id: '6071e8f68f25e32e7c9c5b04', name: 'Alice Williams', email: 'alice@example.com', lastActive: '2025-04-10T11:20:00Z' },
  { _id: '6071e8f68f25e32e7c9c5b05', name: 'Charlie Brown', email: 'charlie@example.com', lastActive: '2025-04-08T13:10:00Z' },
];

const LiveData: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [liveData, setLiveData] = useState(MOCK_LIVE_DATA);
  const [loading, setLoading] = useState(false);

  const handleRefreshData = () => {
    setLoading(true);
    
    // Simulate API fetch delay
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Data Refreshed",
        description: "Live data has been refreshed from MongoDB",
      });
    }, 800);
  };

  return (
    <div className="min-h-screen bg-dark flex flex-col items-center">
      <header className="w-full p-4 flex justify-between items-center">
        <SageLogo />
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            className="text-white hover:bg-dark-foreground/20"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <div className="flex-grow w-full max-w-5xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Database className="h-5 w-5 mr-2 text-sage" />
            <h1 className="text-white text-2xl font-bold">MongoDB Live Data</h1>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => navigate('/all-live-data')}
              variant="outline"
              className="border-sage text-sage hover:bg-sage/20"
            >
              <Table className="h-4 w-4 mr-2" />
              View All Live Data
            </Button>
            
            <Button 
              onClick={handleRefreshData} 
              variant="outline" 
              size="sm"
              disabled={loading}
              className="border-sage text-sage hover:bg-sage/20"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </>
              )}
            </Button>
          </div>
        </div>
        
        <div className="bg-dark-foreground/10 p-6 rounded-lg">
          <div className="p-4 bg-amber-500/20 border border-amber-500/50 rounded-lg mb-6">
            <div className="flex items-start">
              <div>
                <p className="text-gray-300 text-sm">
                  This is a demonstration of MongoDB data display. In a production application,
                  this data would be fetched from your MongoDB database via a backend API.
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <TableComponent className="border-collapse">
              <TableCaption>Live data from MongoDB collection</TableCaption>
              <TableHeader>
                <TableRow className="bg-dark-foreground/20 border-b border-dark-foreground/30">
                  <TableHead className="text-gray-400">ID</TableHead>
                  <TableHead className="text-gray-400">Name</TableHead>
                  <TableHead className="text-gray-400">Email</TableHead>
                  <TableHead className="text-gray-400">Last Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {liveData.map((item) => (
                  <TableRow key={item._id} className="border-b border-dark-foreground/10 hover:bg-dark-foreground/5">
                    <TableCell className="text-sm text-gray-300 font-mono">{item._id}</TableCell>
                    <TableCell className="text-white">{item.name}</TableCell>
                    <TableCell className="text-gray-400">{item.email}</TableCell>
                    <TableCell className="text-gray-400">
                      {new Date(item.lastActive).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableComponent>
          </div>
        </div>

        {user && (
          <div className="p-4 bg-dark-foreground/10 rounded-lg mt-6">
            <p className="text-gray-400">Current user: {user.email}</p>
          </div>
        )}
      </div>

      <footer className="w-full p-6 mt-auto text-center">
        <p className="text-gray-400 text-sm">
          Need help? <a href="#" className="text-sage hover:underline">Contact Support</a>
        </p>
      </footer>
    </div>
  );
};

export default LiveData;
