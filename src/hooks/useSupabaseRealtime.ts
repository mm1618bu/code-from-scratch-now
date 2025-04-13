
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
  const channelRef = useRef<any>(null);

  useEffect(() => {
    console.log('Setting up Supabase realtime subscription for alerts only');
    
    // Cancel any existing subscription
    if (channelRef.current) {
      console.log('Removing existing Supabase realtime subscription');
      supabase.removeChannel(channelRef.current);
    }
    
    // Set up a new subscription
    const channel = supabase
      .channel('public:liveData:alertsOnly')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'liveData' 
      }, (payload) => {
        console.log('Real-time update received in useSupabaseRealtime hook:', payload);
        
        // Only process for alerts, don't trigger auto refresh
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
    
    // Store the channel reference so we can clean it up later
    channelRef.current = channel;
      
    return () => {
      console.log('Removing Supabase realtime subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [onNewAlert, toast]);
};
