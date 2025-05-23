
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { LiveDataItem } from '@/types/liveData';

export const useDataFetching = (onCheckAlerts: (data: LiveDataItem[]) => void) => {
  const { toast } = useToast();
  const [liveData, setLiveData] = useState<LiveDataItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);

  // Minimum time between manual refreshes (in milliseconds)
  const MIN_REFRESH_INTERVAL = 5000; // 5 seconds
  const MINIMUM_LOADING_TIME = 2000; // 2 seconds visible loading state

  // Initial fetch with smaller limit for faster first load
  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    const fetchStartTime = Date.now();
    
    try {
      console.log('Fetching initial data from Supabase...');
      const { data, error } = await supabase
        .from('liveData')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      if (data) {
        console.log(`Fetched ${data.length} initial records`);
        setLiveData(data as LiveDataItem[]);
        onCheckAlerts(data as LiveDataItem[]);
        setLastRefreshTime(Date.now());
      }
      
      // Enforce minimum loading time for better UX
      const elapsedTime = Date.now() - fetchStartTime;
      const remainingTime = Math.max(0, MINIMUM_LOADING_TIME - elapsedTime);
      
      setTimeout(() => {
        setLoading(false);
      }, remainingTime);
      
    } catch (error) {
      console.error('Error fetching initial live data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch live data",
        variant: "destructive"
      });
      setLoading(false);
    }
  }, [onCheckAlerts, toast]);

  // Full data fetch (used for manual refresh)
  const fetchLiveData = useCallback(async () => {
    // Prevent rapid refreshing by enforcing minimum time between refreshes
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTime;
    
    if (timeSinceLastRefresh < MIN_REFRESH_INTERVAL) {
      console.log(`Refresh attempted too soon. Please wait ${Math.ceil((MIN_REFRESH_INTERVAL - timeSinceLastRefresh)/1000)} seconds before refreshing again.`);
      toast({
        title: "Refresh Limited",
        description: `Please wait a moment before refreshing again`,
      });
      return;
    }
    
    setLoading(true);
    const fetchStartTime = Date.now();
    
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
        
        setLastRefreshTime(Date.now());
      }
      
      // Enforce minimum loading time for better UX
      const elapsedTime = Date.now() - fetchStartTime;
      const remainingTime = Math.max(0, MINIMUM_LOADING_TIME - elapsedTime);
      
      setTimeout(() => {
        setLoading(false);
      }, remainingTime);
      
    } catch (error) {
      console.error('Error fetching all live data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch live data",
        variant: "destructive"
      });
      setLoading(false);
    }
  }, [lastRefreshTime, onCheckAlerts, toast]);

  return {
    liveData,
    loading,
    fetchLiveData,
    fetchInitialData
  };
};
