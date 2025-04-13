
import { useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { LiveDataItem } from '@/types/liveData';
import { notifyMachineStateChange } from '@/lib/notification';

export const useSupabaseRealtime = (
  onFetchData: () => void,
  onNewAlert: (data: LiveDataItem) => void
) => {
  const { toast } = useToast();
  const lastRefreshTimeRef = useRef<number>(Date.now());
  const pendingRefreshRef = useRef<boolean>(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Throttled refresh function that ensures we don't refresh more than once every 5 seconds
  const throttledRefresh = useCallback(() => {
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTimeRef.current;
    const minimumRefreshInterval = 5000; // 5 seconds in milliseconds
    
    // If we've already scheduled a refresh, don't schedule another one
    if (pendingRefreshRef.current) {
      console.log('Refresh already pending, skipping new refresh request');
      return;
    }
    
    // If it's been less than 5 seconds since the last refresh,
    // schedule a refresh for when 5 seconds have passed
    if (timeSinceLastRefresh < minimumRefreshInterval) {
      console.log(`Too soon to refresh (${timeSinceLastRefresh}ms since last refresh), scheduling for later`);
      pendingRefreshRef.current = true;
      
      // Clear any existing timeout
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      
      // Schedule a new refresh
      refreshTimeoutRef.current = setTimeout(() => {
        console.log('Executing delayed refresh');
        onFetchData();
        lastRefreshTimeRef.current = Date.now();
        pendingRefreshRef.current = false;
        refreshTimeoutRef.current = null;
      }, minimumRefreshInterval - timeSinceLastRefresh);
    } else {
      // If it's been more than 5 seconds, refresh immediately
      console.log('Refresh threshold met, refreshing immediately');
      onFetchData();
      lastRefreshTimeRef.current = now;
    }
  }, [onFetchData]);

  useEffect(() => {
    console.log('Setting up Supabase realtime subscription');
    
    const channel = supabase
      .channel('public:liveData:hook')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'liveData' 
      }, (payload) => {
        console.log('Real-time update received in useSupabaseRealtime hook:', payload);
        
        // Use the throttled refresh function instead of calling onFetchData directly
        throttledRefresh();
        
        // Process alerts if necessary
        if (payload.new && 
            typeof payload.new === 'object' && 
            'total_current' in payload.new && 
            'machineId' in payload.new) {
          
          const newData = payload.new as LiveDataItem;
          onNewAlert(newData);
          
          // Handle state change notifications
          if ('state' in newData && 
              newData.total_current >= 15.0 && 
              payload.old && 
              typeof payload.old === 'object' && 
              'state' in payload.old && 
              payload.old.state !== newData.state) {
            
            notifyMachineStateChange({
              machineId: newData.machineId,
              previousState: payload.old.state as string,
              newState: newData.state as string,
              timestamp: new Date(newData.created_at).toISOString(),
              totalCurrent: newData.total_current
            });
            
            toast({
              title: `State Change for Machine ${newData.machineId}`,
              description: `State changed from ${payload.old.state} to ${newData.state}`,
              variant: "destructive",
            });
          }
        }
      })
      .subscribe((status) => {
        console.log('Realtime subscription status in useSupabaseRealtime:', status);
      });
      
    return () => {
      // Clean up timeout if component unmounts
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      
      console.log('Removing Supabase realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [throttledRefresh, onNewAlert, toast, onFetchData]);
};
