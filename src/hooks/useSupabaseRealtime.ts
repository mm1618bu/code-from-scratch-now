
import { useEffect, useRef } from 'react';
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
  onFetchData: () => void,
  onNewAlert: (data: LiveDataItem) => void,
  onDowntimeAlert?: (downtimeInfo: MachineDowntimeNotification) => void
) => {
  const channelRef = useRef<any>(null);
  const offlineCheckIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    console.log('Setting up Supabase realtime subscription for alerts including state changes and high current');
    
    if (channelRef.current) {
      console.log('Removing existing Supabase realtime subscription');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
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
    
    const processPayload = async (payload: any, eventType: string) => {
      if (payload.new && 
          typeof payload.new === 'object' && 
          'machineId' in payload.new) {
        
        const newData = payload.new as LiveDataItem;
        
        console.log(`Processing ${eventType} for ${newData.machineId}:`, {
          state: newData.state,
          totalCurrent: newData.total_current,
          previousState: payload.old?.state,
          CT1: newData.CT1,
          CT2: newData.CT2,
          CT3: newData.CT3
        });
        
        if (newData.total_current >= 15.0) {
          console.log(`High current detected (${newData.total_current}A) for ${newData.machineId}`);
          onNewAlert(newData);
        }
        
        if ('state' in newData && 
            payload.old && 
            typeof payload.old === 'object' && 
            'state' in payload.old && 
            payload.old.state !== newData.state) {
          
          console.log(`State change detected for ${newData.machineId}: ${payload.old.state} -> ${newData.state}`);
          
          notifyMachineStateChange({
            machineId: newData.machineId,
            previousState: payload.old.state as string,
            newState: newData.state as string,
            timestamp: new Date(newData.created_at).toISOString(),
            totalCurrent: newData.total_current
          });
          
          onNewAlert(newData);
        }
        
        if (payload.old && typeof payload.old === 'object') {
          const prevData = payload.old as Record<string, any>;
          
          if (isMachineOffline(newData) && !isMachineOffline(prevData)) {
            console.log(`Machine ${newData.machineId} went offline`);
            trackMachineOffline(newData.machineId, newData.created_at);
          }
          
          if (!isMachineOffline(newData) && isMachineOffline(prevData)) {
            console.log(`Machine ${newData.machineId} came back online`);
            const downtimeInfo = await trackMachineOnline(newData.machineId, newData.created_at);
            
            if (downtimeInfo && onDowntimeAlert) {
              onDowntimeAlert(downtimeInfo);
            }
          }
        }
      }
    };
    
    channelRef.current = channel;
    
    offlineCheckIntervalRef.current = window.setInterval(async () => {
      console.log("Running 2-minute offline machines status check");
      const updates = await checkOfflineMachinesStatus();
      
      if (updates && updates.length > 0 && onDowntimeAlert) {
        updates.forEach(update => {
          if (update) {
            onDowntimeAlert(update);
          }
        });
      }
    }, 2 * 60 * 1000);
      
    return () => {
      console.log('Cleaning up Supabase realtime subscription - preventing memory leaks');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      
      if (offlineCheckIntervalRef.current) {
        clearInterval(offlineCheckIntervalRef.current);
        offlineCheckIntervalRef.current = null;
      }
    };
  }, [onDowntimeAlert, onNewAlert]);
};
