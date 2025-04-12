
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { LiveDataItem } from '@/types/liveData';
import { AlertItem } from '@/components/LiveData/AlertMenu';

export const useLiveData = () => {
  const { toast } = useToast();
  const [liveData, setLiveData] = useState<LiveDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [alertCount, setAlertCount] = useState(0);
  const [showAlerts, setShowAlerts] = useState(false);
  const [currentAlerts, setCurrentAlerts] = useState<AlertItem[]>([]);
  const itemsPerPage = 10;

  const fetchLiveData = async () => {
    setLoading(true);
    
    try {
      console.log('Fetching data from Supabase...');
      const { data, error } = await supabase
        .from('liveData')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      if (data) {
        console.log('Fetched data for AllLiveData:', data);
        setLiveData(data as LiveDataItem[]);
        
        const highCurrentItems = (data as LiveDataItem[]).filter(item => item.total_current >= 15.0);
        
        if (highCurrentItems.length > 0) {
          const newAlerts = highCurrentItems.map(item => ({
            machineId: item.machineId,
            value: item.total_current,
            timestamp: new Date(item.created_at).toLocaleString()
          }));
          
          setCurrentAlerts(prev => {
            const combined = [...prev, ...newAlerts];
            const unique = combined.reduce((acc, curr) => {
              acc[curr.machineId] = curr;
              return acc;
            }, {} as Record<string, AlertItem>);
            
            return Object.values(unique);
          });
          
          setAlertCount(prev => prev + highCurrentItems.length);
          
          // Only show toast for high current items
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

  const clearAlerts = () => {
    setCurrentAlerts([]);
    setAlertCount(0);
    setShowAlerts(false);
  };

  useEffect(() => {
    fetchLiveData();
    
    const channel = supabase
      .channel('public:liveData')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'liveData' 
      }, (payload) => {
        console.log('Real-time update received for AllLiveData:', payload);
        
        if (payload.new && 
            typeof payload.new === 'object' && 
            'total_current' in payload.new && 
            'machineId' in payload.new) {
          
          const newData = payload.new as LiveDataItem;
          
          // Only show notifications for items with total_current over 15.0
          if (newData.total_current >= 15.0) {
            const newAlert = {
              machineId: newData.machineId,
              value: newData.total_current,
              timestamp: new Date().toLocaleString()
            };
            
            setCurrentAlerts(prev => {
              const filtered = prev.filter(a => a.machineId !== newAlert.machineId);
              return [...filtered, newAlert];
            });
            
            setAlertCount(prev => prev + 1);
            
            // Show toast for high current
            toast({
              title: "High Current Alert",
              description: `Machine ${newData.machineId} total current: ${newData.total_current.toFixed(2)}`,
              variant: "destructive",
            });
          }
          
          // For state changes, only notify if total_current is over 15.0
          if ('state' in newData && 
              newData.total_current >= 15.0 && 
              payload.old && 
              typeof payload.old === 'object' && 
              'state' in payload.old && 
              payload.old.state !== newData.state) {
            
            toast({
              title: `State Change for Machine ${newData.machineId}`,
              description: `State changed from ${payload.old.state} to ${newData.state}`,
              variant: "destructive",
            });
          }
        }
        
        fetchLiveData();
      })
      .subscribe((status) => {
        console.log('Supabase channel status for AllLiveData:', status);
      });
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [stateFilter]);

  const uniqueStates = ["all", ...Array.from(new Set(liveData.map(item => item.state)))];

  const filteredData = stateFilter === "all" 
    ? liveData 
    : liveData.filter(item => item.state === stateFilter);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  
  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return {
    liveData,
    loading,
    stateFilter,
    setStateFilter,
    currentPage,
    setCurrentPage,
    alertCount,
    showAlerts,
    setShowAlerts,
    currentAlerts,
    clearAlerts,
    fetchLiveData,
    uniqueStates,
    filteredData,
    totalPages,
    currentData,
    itemsPerPage
  };
};
