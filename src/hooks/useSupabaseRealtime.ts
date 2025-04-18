
import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { LiveDataItem } from '@/types/liveData';
import { 
  notifyMachineStateChange,
  isMachineOffline,
  trackMachineOffline,
  trackMachineOnline,
  checkOfflineMachinesStatus
} from '@/lib/notification';
import { MachineDowntimeNotification } from '@/lib/notification';

export const useSupabaseRealtime = (
  onFetchData: () => void, // This parameter is completely ignored
  onNewAlert: (data: LiveDataItem) => void,
  onDowntimeAlert?: (downtimeInfo: MachineDowntimeNotification) => void
) => {
  const { toast } = useToast();
  const channelRef = useRef<any>(null);
  const offlineCheckIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    console.log('Setting up Supabase realtime subscription for alerts including state changes and high current');
    
    // Cancel any existing subscription to prevent multiple instances
    if (channelRef.current) {
      console.log('Removing existing Supabase realtime subscription');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    // Set up a new subscription for both inserts and updates
    const channel = supabase
      .channel('alerts-and-changes')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'liveData' 
      }, async (payload) => {
        console.log('New record inserted:', payload);
        processPayload(payload, 'INSERT');
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'liveData' 
      }, async (payload) => {
        console.log('Record updated:', payload);
        processPayload(payload, 'UPDATE');
      })
      .subscribe((status) => {
        console.log('Supabase subscription status:', status);
      });
    
    // Function to process both inserts and updates
    const processPayload = async (payload: any, eventType: string) => {
      if (payload.new && 
          typeof payload.new === 'object' && 
          'machineId' in payload.new) {
        
        const newData = payload.new as LiveDataItem;
        
        // Log detailed information for debugging
        console.log(`Processing ${eventType} for ${newData.machineId}:`, {
          state: newData.state,
          totalCurrent: newData.total_current,
          previousState: payload.old?.state,
          CT1: newData.CT1,
          CT2: newData.CT2,
          CT3: newData.CT3
        });
        
        // Check for high current - process alerts regardless of event type
        if (newData.total_current >= 15.0) {
          console.log(`High current detected (${newData.total_current}A) for ${newData.machineId}`);
          onNewAlert(newData);
          
          // Show a toast for high current
          toast({
            title: `High Current: ${newData.machineId}`,
            description: `Current value: ${newData.total_current.toFixed(2)} A`,
            variant: "destructive"
          });
        }
        
        // Handle state changes if we have previous state information (in updates)
        if ('state' in newData && 
            payload.old && 
            typeof payload.old === 'object' && 
            'state' in payload.old && 
            payload.old.state !== newData.state) {
          
          console.log(`State change detected for ${newData.machineId}: ${payload.old.state} -> ${newData.state}`);
          
          // Always notify of state changes regardless of current level
          notifyMachineStateChange({
            machineId: newData.machineId,
            previousState: payload.old.state as string,
            newState: newData.state as string,
            timestamp: new Date(newData.created_at).toISOString(),
            totalCurrent: newData.total_current
          });
          
          // Show a toast for state change
          toast({
            title: `State Change: ${newData.machineId}`,
            description: `${payload.old.state} → ${newData.state}`,
            variant: "info"
          });
          
          // Process the alert with the latest state information
          onNewAlert(newData);
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
    };
    
    // Store the channel reference so we can clean it up later
    channelRef.current = channel;
    
    // Set up periodic check for offline machines (every 2 minutes)
    offlineCheckIntervalRef.current = window.setInterval(async () => {
      console.log("Running 2-minute offline machines status check");
      const updates = await checkOfflineMachinesStatus();
      
      // Process any offline machine updates
      if (updates && updates.length > 0 && onDowntimeAlert) {
        updates.forEach(update => {
          if (update) {
            onDowntimeAlert(update);
          }
        });
      }
    }, 2 * 60 * 1000); // 2 minutes in milliseconds
      
    // Cleanup function to properly unsubscribe
    return () => {
      console.log('Cleaning up Supabase realtime subscription - preventing memory leaks');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      
      // Clear the interval
      if (offlineCheckIntervalRef.current) {
        clearInterval(offlineCheckIntervalRef.current);
        offlineCheckIntervalRef.current = null;
      }
    };
  }, [onDowntimeAlert, onNewAlert, toast]); // Add toast to dependency array
};
