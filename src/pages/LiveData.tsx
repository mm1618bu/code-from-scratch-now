
import React, { useState, useEffect } from 'react';
import SageLogo from '@/components/SageLogo';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Database, RefreshCw, Table, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Table as TableComponent,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

const LiveData: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [liveData, setLiveData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLiveData = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('liveData')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) {
        throw error;
      }
      
      if (data) {
        console.log('Fetched data:', data);
        setLiveData(data);
        toast({
          title: "Data Refreshed",
          description: "Live data has been refreshed from Supabase",
        });
      }
    } catch (error) {
      console.error('Error fetching live data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch live data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveData();
    
    // Subscribe to real-time changes
    const channel = supabase
      .channel('public:liveData')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'liveData' 
      }, (payload) => {
        console.log('Real-time update received:', payload);
        fetchLiveData(); // Refresh data when changes occur
      })
      .subscribe((status) => {
        console.log('Supabase channel status:', status);
      });
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
            <h1 className="text-white text-2xl font-bold">Supabase Live Data</h1>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => navigate('/notifications')}
              variant="outline"
              className="border-sage text-sage hover:bg-sage/20"
            >
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </Button>
            
            <Button 
              onClick={() => navigate('/all-live-data')}
              variant="outline"
              className="border-sage text-sage hover:bg-sage/20"
            >
              <Table className="h-4 w-4 mr-2" />
              View All Live Data
            </Button>
            
            <Button 
              onClick={fetchLiveData} 
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
          {liveData.length === 0 && !loading ? (
            <div className="p-8 text-center text-gray-400">
              <p>No data available. Try clicking "Start Mock Data" to generate some data.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <TableComponent className="border-collapse">
                <TableCaption>Live data from Supabase collection</TableCaption>
                <TableHeader>
                  <TableRow className="bg-dark-foreground/20 border-b border-dark-foreground/30">
                    <TableHead className="text-gray-400">Machine ID</TableHead>
                    <TableHead className="text-gray-400">State</TableHead>
                    <TableHead className="text-gray-400">Timestamp</TableHead>
                    <TableHead className="text-gray-400">Current Avg</TableHead>
                    <TableHead className="text-gray-400">Fault Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="flex justify-center">
                          <RefreshCw className="h-8 w-8 animate-spin text-sage" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    liveData.map((item: any) => (
                      <TableRow key={`${item.machineId}-${item.created_at}`} className="border-b border-dark-foreground/10 hover:bg-dark-foreground/5">
                        <TableCell className="text-white">{item.machineId}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            item.state === 'running' ? 'bg-green-500/20 text-green-400' :
                            item.state === 'idle' ? 'bg-blue-500/20 text-blue-400' :
                            item.state === 'error' ? 'bg-red-500/20 text-red-400' :
                            item.state === 'maintenance' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {item.state}
                          </span>
                        </TableCell>
                        <TableCell className="text-gray-400">
                          {new Date(item.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-gray-400">{item.CT_Avg?.toFixed(2) || 'N/A'}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            item.fault_status === 'normal' ? 'bg-green-500/20 text-green-400' :
                            item.fault_status === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                            item.fault_status === 'critical' ? 'bg-red-500/20 text-red-400' :
                            item.fault_status === 'fault_detected' ? 'bg-orange-500/20 text-orange-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {item.fault_status || 'N/A'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </TableComponent>
            </div>
          )}
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
