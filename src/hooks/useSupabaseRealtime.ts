
import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { LiveDataItem } from '@/types/liveData';
import { 
  notifyMachineStateChange,
  isMachineOffline,
  trackMachineOffline,
  trackMachineOnline
} from '@/lib/notification';
import { MachineDowntimeNotification } from '@/lib/notification';

export const useSupabaseRealtime = (
  onFetchData: () => void, // This parameter is completely ignored
  onNewAlert: (data: LiveDataItem) => void,
  onDowntimeAlert?: (downtimeInfo: MachineDowntimeNotification) => void
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
    
    // Set up a new subscription specifically for new inserts only
    const channel = supabase
      .channel('alerts-only-new-inserts')
      .on('postgres_changes', { 
        event: 'INSERT', // Only listen for new inserts, not existing data 
        schema: 'public', 
        table: 'liveData' 
      }, async (payload) => {
        console.log('New record inserted, processing for alerts only:', payload);
        
        // Only process alerts for new inserts
        if (payload.new && 
            typeof payload.new === 'object' && 
            'total_current' in payload.new && 
            'machineId' in payload.new) {
          
          const newData = payload.new as LiveDataItem;
          
          // Process alerts for the new data
          console.log('Processing alert for new insert only');
          onNewAlert(newData);
          
          // Handle state change notifications for new inserts with high current
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
          }
          
          // Check for machine offline/online transitions
          if (payload.old && typeof payload.old === 'object') {
            const prevData = payload.old as Record<string, any>;
            
            // Check if machine is going offline
            if (isMachineOffline(newData) && !isMachineOffline(prevData)) {
              console.log(`Machine ${newData.machineId} went offline`);
              trackMachineOffline(newData.machineId, newData.created_at);
            }
            
            // Check if machine is coming back online
            if (!isMachineOffline(newData) && isMachineOffline(prevData)) {
              console.log(`Machine ${newData.machineId} came back online`);
              const downtimeInfo = await trackMachineOnline(newData.machineId, newData.created_at);
              
              // If we have downtime info and the callback exists, call it
              if (downtimeInfo && onDowntimeAlert) {
                onDowntimeAlert(downtimeInfo);
              }
            }
          }
        }
      })
      .subscribe((status) => {
        console.log('Alert-only subscription status (new inserts only):', status);
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
  }, [onDowntimeAlert, onNewAlert]); // Add onDowntimeAlert to dependency array
};
