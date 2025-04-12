
import React, { useState, useEffect } from 'react';
import SageLogo from '@/components/SageLogo';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, RefreshCw, Database, Filter, Bell, BellRing } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LiveDataItem {
  id?: string;
  machineId: string;
  state: string;
  created_at: string;
  CT1: number;
  CT2: number;
  CT3: number;
  CT_Avg: number;
  total_current: number;
  state_duration: number;
  fault_status: string;
  fw_version: string;
  mac: string;
  [key: string]: any;
}

interface AlertItem {
  machineId: string;
  value: number;
  timestamp: string;
}

const AllLiveData: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [liveData, setLiveData] = useState<LiveDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [alertCount, setAlertCount] = useState(0);
  const [showAlerts, setShowAlerts] = useState(false);
  const [currentAlerts, setCurrentAlerts] = useState<AlertItem[]>([]);
  const itemsPerPage = 10; // Increased from 5 to show more per page

  // Function to fetch data from Supabase
  const fetchLiveData = async () => {
    setLoading(true);
    
    try {
      console.log('Fetching data from Supabase...');
      // Ensure we're using the correct Supabase client and table
      const { data, error } = await supabase
        .from('liveData')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100); // Limit to 100 records
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      if (data) {
        console.log('Fetched data for AllLiveData:', data);
        setLiveData(data as LiveDataItem[]);
        
        // Check for high current items
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
            const combined = [...prev, ...newAlerts];
            const unique = combined.reduce((acc, curr) => {
              acc[curr.machineId] = curr;
              return acc;
            }, {} as Record<string, any>);
            
            return Object.values(unique);
          });
          
          // Update alert count
          setAlertCount(prev => prev + highCurrentItems.length);
          
          toast({
            title: "High Current Alert",
            description: `${highCurrentItems.length} machine(s) have total current exceeding threshold`,
            variant: "destructive",
          });
        }
        
        toast({
          title: "Data Refreshed",
          description: `Loaded ${data.length} records from Supabase (max 100)`,
        });
      } else {
        console.log('No data returned from Supabase');
      }
    } catch (error) {
      console.error('Error fetching all live data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch live data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch and realtime subscription
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
        console.log('Real-time update received for AllLiveData:', payload);
        
        // Check if payload.new exists and has required properties
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
        console.log('Supabase channel status for AllLiveData:', status);
      });
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Get unique states for the filter
  const uniqueStates = ["all", ...Array.from(new Set(liveData.map(item => item.state)))];

  // Filter data based on selected state
  const filteredData = stateFilter === "all" 
    ? liveData 
    : liveData.filter(item => item.state === stateFilter);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to first page when filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [stateFilter]);

  const handleRefreshData = () => {
    fetchLiveData();
  };

  const clearAlerts = () => {
    setCurrentAlerts([]);
    setAlertCount(0);
    setShowAlerts(false);
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'running':
        return 'bg-green-500/20 text-green-500 border border-green-500/50';
      case 'idle':
        return 'bg-blue-500/20 text-blue-500 border border-blue-500/50';
      case 'error':
        return 'bg-red-500/20 text-red-500 border border-red-500/50';
      case 'maintenance':
        return 'bg-amber-500/20 text-amber-500 border border-amber-500/50';
      case 'standby':
        return 'bg-purple-500/20 text-purple-500 border border-purple-500/50';
      default:
        return 'bg-gray-500/20 text-gray-500 border border-gray-500/50';
    }
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

      <div className="flex-grow w-full max-w-7xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Database className="h-6 w-6 mr-2 text-sage" />
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
              onClick={() => navigate('/mongodb')}
              variant="outline"
              className="border-sage text-sage hover:bg-sage/20"
            >
              MongoDB Dashboard
            </Button>
            
            <Button 
              onClick={handleRefreshData} 
              variant="outline" 
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
                  Live Data from Supabase
                </p>
              </div>
            </div>
          </div>

          <div className="mb-4 flex justify-end">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">Filter by State:</span>
              <Select
                value={stateFilter}
                onValueChange={setStateFilter}
              >
                <SelectTrigger className="w-[180px] bg-dark-foreground/20 border-dark-foreground/30 text-white">
                  <SelectValue placeholder="Select a state" />
                </SelectTrigger>
                <SelectContent className="bg-dark border-dark-foreground/30">
                  <SelectGroup>
                    <SelectLabel className="text-gray-400">Machine States</SelectLabel>
                    {uniqueStates.map((state) => (
                      <SelectItem key={state} value={state} className="text-white capitalize hover:bg-dark-foreground/20">
                        {state === "all" ? "All States" : state}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Filter className="h-4 w-4 text-sage" />
            </div>
          </div>

          <ScrollArea className="h-[500px] rounded-md border border-dark-foreground/20">
            <Table className="border-collapse">
              <TableCaption>Comprehensive Supabase liveData collection</TableCaption>
              <TableHeader className="sticky top-0 bg-dark z-10">
                <TableRow className="bg-dark-foreground/20 border-b border-dark-foreground/30">
                  <TableHead className="text-gray-400 whitespace-nowrap">Machine ID</TableHead>
                  <TableHead className="text-gray-400 whitespace-nowrap">State</TableHead>
                  <TableHead className="text-gray-400 whitespace-nowrap">CT1</TableHead>
                  <TableHead className="text-gray-400 whitespace-nowrap">CT2</TableHead>
                  <TableHead className="text-gray-400 whitespace-nowrap">CT3</TableHead>
                  <TableHead className="text-gray-400 whitespace-nowrap">CT Avg</TableHead>
                  <TableHead className="text-gray-400 whitespace-nowrap">Total Current</TableHead>
                  <TableHead className="text-gray-400 whitespace-nowrap">State Duration</TableHead>
                  <TableHead className="text-gray-400 whitespace-nowrap">Fault Status</TableHead>
                  <TableHead className="text-gray-400 whitespace-nowrap">FW Version</TableHead>
                  <TableHead className="text-gray-400 whitespace-nowrap">MAC Address</TableHead>
                  <TableHead className="text-gray-400 whitespace-nowrap">Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8">
                      <div className="flex justify-center">
                        <RefreshCw className="h-8 w-8 animate-spin text-sage" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : currentData.length > 0 ? (
                  currentData.map((item) => (
                    <TableRow 
                      key={`${item.machineId}-${item.created_at}`} 
                      className={`border-b border-dark-foreground/10 hover:bg-dark-foreground/5 ${
                        item.total_current >= 15.0 ? 'bg-red-900/20' : ''
                      }`}
                    >
                      <TableCell className="text-white font-medium">{item.machineId}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${getStateColor(item.state)}`}>
                          {item.state}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-300">{item.CT1}</TableCell>
                      <TableCell className="text-gray-300">{item.CT2}</TableCell>
                      <TableCell className="text-gray-300">{item.CT3}</TableCell>
                      <TableCell className="text-gray-300">{item.CT_Avg}</TableCell>
                      <TableCell className={item.total_current >= 15.0 ? 'text-red-400 font-bold' : 'text-gray-300'}>
                        {item.total_current}
                        {item.total_current >= 15.0 && (
                          <span className="ml-2 px-1.5 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">
                            HIGH
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-300">{item.state_duration}s</TableCell>
                      <TableCell className="text-gray-300">{item.fault_status}</TableCell>
                      <TableCell className="text-gray-300">{item.fw_version}</TableCell>
                      <TableCell className="text-gray-300 font-mono text-xs">{item.mac}</TableCell>
                      <TableCell className="text-gray-300 whitespace-nowrap">
                        {new Date(item.created_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8 text-gray-400">
                      {stateFilter === "all" ? "No data available in Supabase" : "No data matches the selected filter"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
          
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className={currentPage === 1 ? "opacity-50 pointer-events-none" : "text-sage hover:bg-sage/20"}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => setCurrentPage(page)}
                    isActive={page === currentPage}
                    className={page === currentPage ? "bg-sage text-white hover:bg-sage/90" : "text-white"}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages ? "opacity-50 pointer-events-none" : "text-sage hover:bg-sage/20"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
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

export default AllLiveData;
