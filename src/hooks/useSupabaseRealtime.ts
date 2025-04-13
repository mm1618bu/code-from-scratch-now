
import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { LiveDataItem } from '@/types/liveData';
import { notifyMachineStateChange } from '@/lib/notification';

export const useSupabaseRealtime = (
  onFetchData: () => void, // This parameter is completely ignored
  onNewAlert: (data: LiveDataItem) => void
) => {
  const { toast } = useToast();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    console.log('Setting up Supabase realtime subscription for alerts only - NO DATA REFRESH');
    
    // Cancel any existing subscription to prevent multiple instances
    if (channelRef.current) {
      console.log('Removing existing Supabase realtime subscription');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    // Set up a new subscription specifically for alerts only, explicitly prevents data refresh
    const channel = supabase
      .channel('alerts-only-no-refresh')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'liveData' 
      }, (payload) => {
        console.log('Alert-only update received, NEVER refreshing data:', payload);
        
        // Only process alerts, NEVER trigger data refresh
        if (payload.new && 
            typeof payload.new === 'object' && 
            'total_current' in payload.new && 
            'machineId' in payload.new) {
          
          const newData = payload.new as LiveDataItem;
          
          // Only process alerts, explicitly NO data refreshing
          console.log('Processing alert only, NO data refresh will be triggered');
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
        console.log('Alert-only subscription status (NO data refresh):', status);
      });
    
    // Store the channel reference so we can clean it up later
    channelRef.current = channel;
      
    // Cleanup function to properly unsubscribe
    return () => {
      console.log('Cleaning up Supabase realtime subscription - preventing memory leaks');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []); // Empty dependency array to run only once on mount

  return; // No need to return anything
};
