
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
        
        // Add a small artificial delay to make loading more visible (min 1 second)
        const startTime = Date.now();
        const minimumLoadTime = 1000; // 1 second in milliseconds
        
        setTimeout(() => {
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
          setLoading(false);
        }, Math.max(0, minimumLoadTime - (Date.now() - startTime)));
      } else {
        console.log('No data returned from Supabase');
        
        // Still add minimum delay even if no data
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      }
    } catch (error) {
      console.error('Error fetching initial live data:', error);
      
      // Add minimum delay even on error
      setTimeout(() => {
        if (initialLoadDone) {
          toast({
            title: "Error",
            description: "Failed to fetch live data",
            variant: "destructive"
          });
        }
        setLoading(false);
      }, 1000);
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
        
        // Add a small artificial delay to make loading more visible (min 1 second)
        const startTime = Date.now();
        const minimumLoadTime = 1000; // 1 second in milliseconds
        
        setTimeout(() => {
          setLiveData(data as LiveDataItem[]);
          onCheckAlerts(data as LiveDataItem[]);
          
          toast({
            title: "Data Refreshed",
            description: `Loaded ${data.length} records from Supabase (max 500)`,
          });
          
          setLoading(false);
        }, Math.max(0, minimumLoadTime - (Date.now() - startTime)));
      } else {
        console.log('No data returned from Supabase');
        
        // Still add minimum delay even if no data
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      }
    } catch (error) {
      console.error('Error fetching all live data:', error);
      
      // Add minimum delay even on error
      setTimeout(() => {
        toast({
          title: "Error",
          description: "Failed to fetch live data",
          variant: "destructive"
        });
        setLoading(false);
      }, 1000);
    }
  }, [onCheckAlerts, toast]);

  // Fetch initial data on component mount, but no auto-refresh
  useEffect(() => {
    fetchInitialData();
    // No interval for auto-refresh
  }, [fetchInitialData]);

  return {
    liveData,
    loading,
    fetchLiveData,
    fetchInitialData
  };
};
