
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { LiveDataItem } from '@/types/liveData';

export const useDataFetching = (onCheckAlerts: (data: LiveDataItem[]) => void) => {
  const { toast } = useToast();
  const [liveData, setLiveData] = useState<LiveDataItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLiveData = useCallback(async () => {
    setLoading(true);
    
    try {
      console.log('Fetching data from Supabase...');
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
        console.log(`Fetched ${data.length} records for AllLiveData:`, data);
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

  return {
    liveData,
    loading,
    fetchLiveData
  };
};
