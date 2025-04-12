
import React, { useState, useEffect } from 'react';
import SageLogo from '@/components/SageLogo';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Database, RefreshCw, Table, Bell, BellRing } from 'lucide-react';
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

// Define interfaces for our data types
interface LiveDataItem {
  _id: string;
  machineId: string;
  state: string;
  created_at: string;
  CT_Avg: number;
  total_current: number;
  fault_status: string;
  [key: string]: any; // For other possible properties
}

interface AlertItem {
  machineId: string;
  value: number;
  timestamp: string;
}

const LiveData: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [liveData, setLiveData] = useState<LiveDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertCount, setAlertCount] = useState(0);
  const [showAlerts, setShowAlerts] = useState(false);
  const [currentAlerts, setCurrentAlerts] = useState<AlertItem[]>([]);

  const fetchLiveData = async () => {
    setLoading(true);
    
    try {
      console.log('Fetching live data from Supabase...');
      
      // Use the direct Supabase client import and limit to 5 records
      const { data, error } = await supabase
        .from('liveData')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      if (data) {
        console.log('Fetched data:', data);
        setLiveData(data as LiveDataItem[]);
        
        // Check for any total current values exceeding threshold
        const highCurrentItems = (data as LiveDataItem[]).filter(item => item.total_current >= 15.0);
        
        if (highCurrentItems.length > 0) {
          // Collect new alerts
          const newAlerts = highCurrentItems.map(item => ({
            machineId: item.machineId,
            value: item.total_current,
            timestamp: new Date(item.created_at).toLocaleString()
          }));
          
          // Update alerts
          setCurrentAlerts(prev => {
            // Combine previous alerts with new ones, avoiding duplicates
            const combined = [...prev, ...newAlerts];
            // Remove duplicates by machine ID (keeping the most recent)
            const unique = combined.reduce((acc, curr) => {
              acc[curr.machineId] = curr;
              return acc;
            }, {} as Record<string, any>);
            
            return Object.values(unique);
          });
          
          // Update alert count
          setAlertCount(prev => prev + highCurrentItems.length);
          
          // Notify user of new high current alerts
          toast({
            title: "High Current Alert",
            description: `${highCurrentItems.length} machine(s) have total current exceeding threshold`,
            variant: "destructive",
          });
        }
        
        toast({
          title: "Data Refreshed",
          description: "Live data has been refreshed from Supabase",
        });
      } else {
        console.log('No data returned from Supabase');
        toast({
          title: "No Data",
          description: "No live data available. Try generating mock data.",
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
        
        // Check if payload.new exists and has the required properties
        if (payload.new && 
            typeof payload.new === 'object' && 
            'total_current' in payload.new && 
            'machineId' in payload.new) {
          
          const newData = payload.new as LiveDataItem;
          
          // Check if the updated data has high total current
          if (newData.total_current >= 15.0) {
            const newAlert = {
              machineId: newData.machineId,
              value: newData.total_current,
              timestamp: new Date().toLocaleString()
            };
            
            // Add to alerts
            setCurrentAlerts(prev => {
              const filtered = prev.filter(a => a.machineId !== newAlert.machineId);
              return [...filtered, newAlert];
            });
            
            // Increment alert count
            setAlertCount(prev => prev + 1);
            
            // Show toast notification
            toast({
              title: "High Current Alert",
              description: `Machine ${newData.machineId} total current: ${newData.total_current.toFixed(2)}`,
              variant: "destructive",
            });
          }
        }
        
        fetchLiveData(); // Refresh data when changes occur
      })
      .subscribe((status) => {
        console.log('Supabase channel status:', status);
      });
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Clear alerts
  const clearAlerts = () => {
    setCurrentAlerts([]);
    setAlertCount(0);
    setShowAlerts(false);
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
            <h1 className="text-white text-2xl font-bold">Supabase Live Data</h1>
          </div>
          
          <div className="flex gap-2">
            <div className="relative">
              <Button 
                onClick={() => setShowAlerts(!showAlerts)}
                variant="outline"
                className="border-sage text-sage hover:bg-sage/20 relative"
              >
                {alertCount > 0 ? (
                  <>
                    <BellRing className="h-4 w-4 mr-2 animate-pulse" />
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {alertCount}
                    </span>
                  </>
                ) : (
                  <Bell className="h-4 w-4 mr-2" />
                )}
                Alerts
              </Button>
              
              {showAlerts && currentAlerts.length > 0 && (
                <div className="absolute right-0 mt-2 w-80 bg-dark-foreground/90 border border-sage/30 rounded-md shadow-lg z-10">
                  <div className="p-3 border-b border-sage/20 flex justify-between items-center">
                    <h3 className="text-white font-medium">Current Alerts</h3>
                    <Button variant="ghost" size="sm" onClick={clearAlerts} className="text-gray-400 hover:text-white">
                      Clear All
                    </Button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {currentAlerts.map((alert, index) => (
                      <div 
                        key={`${alert.machineId}-${index}`}
                        className="p-3 border-b border-sage/10 hover:bg-dark-foreground/50"
                      >
                        <div className="flex items-start">
                          <div className="h-2 w-2 mt-1.5 rounded-full bg-red-500 mr-2"></div>
                          <div>
                            <p className="text-white font-medium">Machine {alert.machineId}</p>
                            <p className="text-red-400 text-sm">
                              Total Current: {alert.value.toFixed(2)}
                            </p>
                            <p className="text-gray-400 text-xs mt-1">{alert.timestamp}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
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
                    <TableHead className="text-gray-400">Total Current</TableHead>
                    <TableHead className="text-gray-400">Fault Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex justify-center">
                          <RefreshCw className="h-8 w-8 animate-spin text-sage" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    liveData.map((item: any) => (
                      <TableRow 
                        key={`${item.machineId}-${item.created_at}`} 
                        className={`border-b border-dark-foreground/10 hover:bg-dark-foreground/5 ${
                          item.total_current >= 15.0 ? 'bg-red-900/20' : ''
                        }`}
                      >
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
                        <TableCell className={item.total_current >= 15.0 ? 'text-red-400 font-bold' : 'text-gray-400'}>
                          {item.total_current?.toFixed(2) || 'N/A'}
                          {item.total_current >= 15.0 && (
                            <span className="ml-2 px-1.5 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">
                              HIGH
                            </span>
                          )}
                        </TableCell>
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
