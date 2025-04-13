
import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { LiveDataItem } from '@/types/liveData';

export const useDataFetching = (onCheckAlerts: (data: LiveDataItem[]) => void) => {
  const { toast } = useToast();
  const [liveData, setLiveData] = useState<LiveDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Initial fetch with smaller limit for faster first load
  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    
    try {
      console.log('Fetching initial data from Supabase...');
      const { data, error } = await supabase
        .from('liveData')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50); // Reduced limit for faster initial load
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      if (data) {
        console.log(`Fetched ${data.length} initial records`);
        setLiveData(data as LiveDataItem[]);
        onCheckAlerts(data as LiveDataItem[]);
        
        // Only show toast for manual refreshes, not initial load
        if (initialLoadDone) {
          toast({
            title: "Data Refreshed",
            description: `Loaded ${data.length} records from Supabase`,
          });
        }
        
        setInitialLoadDone(true);
      } else {
        console.log('No data returned from Supabase');
      }
    } catch (error) {
      console.error('Error fetching initial live data:', error);
      if (initialLoadDone) {
        toast({
          title: "Error",
          description: "Failed to fetch live data",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  }, [initialLoadDone, onCheckAlerts, toast]);

  // Full data fetch (used for manual refresh)
  const fetchLiveData = useCallback(async () => {
    setLoading(true);
    
    try {
      console.log('Fetching complete data from Supabase...');
      const { data, error } = await supabase
        .from('liveData')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      if (data) {
        console.log(`Fetched ${data.length} complete records`);
        setLiveData(data as LiveDataItem[]);
        onCheckAlerts(data as LiveDataItem[]);
        
        toast({
          title: "Data Refreshed",
          description: `Loaded ${data.length} records from Supabase (max 500)`,
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
  }, [onCheckAlerts, toast]);

  // Fetch initial data on component mount
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  return {
    liveData,
    loading,
    fetchLiveData,
    fetchInitialData
  };
};
