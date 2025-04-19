import { useState, useEffect } from 'react';
import { notifyTotalCurrentThresholdAlert } from '@/lib/notification';
import { LiveDataItem } from '@/types/liveData';
import { MachineDowntimeNotification } from '@/lib/notification';
import { useToast } from '@/hooks/use-toast';

export interface AlertItem {
  machineId: string;
  value?: number;
  timestamp: string;
  type: 'high-current' | 'downtime' | 'offline-status' | 'state-change' | 'state-update-log' | 'machine-on';
  downtimeDuration?: number;
  offTimestamp?: string;
  onTimestamp?: string;
  isStatusUpdate?: boolean;
  stateValues?: {
    ct1: number;
    ct2: number;
    ct3: number;
    ctAvg: number;
    totalCurrent: number;
  };
  previousState?: string;
  newState?: string;
}

export const useAlerts = () => {
  const [alertCount, setAlertCount] = useState(0);
  const [showAlerts, setShowAlerts] = useState(false);
  const [currentAlerts, setCurrentAlerts] = useState<AlertItem[]>([]);
  const [offlineMachines, setOfflineMachines] = useState<Record<string, { timestamp: string }>>({});
  const { toast } = useToast();

  useEffect(() => {
    console.log('Current alerts in useAlerts hook:', currentAlerts);
  }, [currentAlerts]);

  useEffect(() => {
    if (currentAlerts.length > 0) {
      console.log('Current alerts available:', currentAlerts.length);
      setShowAlerts(true);
    }
  }, [currentAlerts.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = new Date();
      
      Object.entries(offlineMachines).forEach(([machineId, { timestamp }]) => {
        const offlineTime = new Date(timestamp);
        const minutesOffline = (currentTime.getTime() - offlineTime.getTime()) / (1000 * 60);
        
        if (minutesOffline >= 2) {
          const downtimeAlert: AlertItem = {
            machineId,
            timestamp: currentTime.toISOString(),
            type: 'downtime',
            offTimestamp: timestamp,
            downtimeDuration: Math.floor(minutesOffline)
          };
          
          setCurrentAlerts(prev => {
            const exists = prev.some(alert => 
              alert.type === 'downtime' && 
              alert.machineId === machineId && 
              alert.offTimestamp === timestamp
            );
            
            if (!exists) {
              return [...prev, downtimeAlert];
            }
            return prev;
          });
        }
      });
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [offlineMachines]);

  const checkForAlerts = (data: LiveDataItem[]) => {
    console.log(`Checking ${data.length} items for alerts`);
    const highCurrentItems = data.filter(item => item.total_current >= 15.0);
    
    if (highCurrentItems.length > 0) {
      console.log(`Found ${highCurrentItems.length} high current items`);
      const newAlerts = highCurrentItems.map(item => ({
        machineId: item.machineId,
        value: item.total_current,
        timestamp: new Date(item.created_at).toLocaleString(),
        type: 'high-current' as const
      }));
      
      setCurrentAlerts(prev => {
        const combined = [...prev, ...newAlerts];
        const unique = combined.reduce((acc, curr) => {
          const key = `${curr.type}-${curr.machineId}`;
          acc[key] = curr;
          return acc;
        }, {} as Record<string, AlertItem>);
        
        return Object.values(unique);
      });
      
      setAlertCount(prev => prev + highCurrentItems.length);
      
      if (newAlerts.length > 0) {
        setShowAlerts(true);
      }
      
      highCurrentItems.forEach(item => {
        notifyTotalCurrentThresholdAlert({
          machineId: item.machineId,
          totalCurrent: item.total_current,
          timestamp: new Date(item.created_at).toISOString()
        });
      });
    }
  };

  const processAlert = (newData: LiveDataItem) => {
    console.log('Processing alert for:', newData.machineId, {
      state: newData.state,
      totalCurrent: newData.total_current
    });
    
    // Prevent creating blank records
    if (!newData.machineId || !newData.created_at || !newData.state) return;

    if (newData.total_current >= 1.0) {
      console.log(`Machine ${newData.machineId} is now ON with current: ${newData.total_current}A`);
      
      if (offlineMachines[newData.machineId]) {
        setOfflineMachines(prev => {
          const { [newData.machineId]: _, ...rest } = prev;
          return rest;
        });
      }
      
      const newAlert = {
        machineId: newData.machineId,
        value: newData.total_current,
        timestamp: new Date(newData.created_at).toLocaleString(),
        type: 'machine-on' as const
      };
      
      setCurrentAlerts(prev => {
        const filtered = prev.filter(a => !(a.type === 'machine-on' && a.machineId === newAlert.machineId));
        return [...filtered, newAlert];
      });
      
      setAlertCount(prev => prev + 1);
      setShowAlerts(true);
    } else if (newData.total_current < 1.0) {
      setOfflineMachines(prev => ({
        ...prev,
        [newData.machineId]: { timestamp: new Date(newData.created_at).toISOString() }
      }));
    }

    if (newData.total_current >= 15.0) {
      console.log(`High current detected for ${newData.machineId}: ${newData.total_current}A`);
      const newAlert = {
        machineId: newData.machineId,
        value: newData.total_current,
        timestamp: new Date(newData.created_at).toLocaleString(),
        type: 'high-current' as const
      };
      
      setCurrentAlerts(prev => {
        const filtered = prev.filter(a => !(a.type === 'high-current' && a.machineId === newAlert.machineId));
        return [...filtered, newAlert];
      });
      
      setAlertCount(prev => prev + 1);
      setShowAlerts(true);
      
      notifyTotalCurrentThresholdAlert({
        machineId: newData.machineId,
        totalCurrent: newData.total_current,
        timestamp: new Date(newData.created_at).toISOString()
      });
    }

    if (newData.state) {
      console.log(`Processing state change for ${newData.machineId}: ${newData.state}`);
      const newAlert = {
        machineId: newData.machineId,
        timestamp: new Date(newData.created_at).toLocaleString(),
        type: 'state-change' as const,
        stateValues: {
          ct1: newData.CT1,
          ct2: newData.CT2,
          ct3: newData.CT3,
          ctAvg: (newData.CT1 + newData.CT2 + newData.CT3) / 3,
          totalCurrent: newData.total_current
        },
        newState: newData.state
      };
      
      setCurrentAlerts(prev => {
        const key = `state-change-${newAlert.machineId}-${newAlert.timestamp}`;
        const filtered = prev.filter(a => 
          !(a.type === 'state-change' && 
            a.machineId === newAlert.machineId && 
            a.timestamp === newAlert.timestamp)
        );
        const updatedAlerts = [...filtered, newAlert];
        console.log('Updated state change alerts:', updatedAlerts.length);
        return updatedAlerts;
      });
      
      setAlertCount(prev => prev + 1);
      setShowAlerts(true);
    }
  };

  const addStateChangeAlert = (machineId: string, previousState: string, newState: string, timestamp: string) => {
    console.log(`Adding state change alert for ${machineId}: ${previousState} → ${newState}`);
    
    const newAlert: AlertItem = {
      machineId,
      previousState,
      newState,
      timestamp: new Date(timestamp).toLocaleString(),
      type: 'state-change' as const
    };
    
    setCurrentAlerts(prev => {
      const exists = prev.some(a => 
        a.type === 'state-change' && 
        a.machineId === newAlert.machineId &&
        a.previousState === newAlert.previousState &&
        a.newState === newAlert.newState
      );
      
      if (exists) {
        return prev;
      }
      
      const updatedAlerts = [...prev, newAlert];
      console.log('Updated state change alerts:', updatedAlerts.length);
      return updatedAlerts;
    });
    
    setAlertCount(prev => prev + 1);
    setShowAlerts(true);
  };

  const addDowntimeAlert = (downtimeInfo: MachineDowntimeNotification) => {
    const isStatusUpdate = !downtimeInfo.onTimestamp || downtimeInfo.onTimestamp === downtimeInfo.offTimestamp;
    const alertType = isStatusUpdate ? 'offline-status' : 'downtime';
    
    console.log(`Adding ${alertType} alert for ${downtimeInfo.machineId}, duration: ${downtimeInfo.downtimeDuration} minutes`);
    
    const newAlert: AlertItem = {
      machineId: downtimeInfo.machineId,
      timestamp: new Date(isStatusUpdate ? downtimeInfo.offTimestamp : downtimeInfo.onTimestamp).toLocaleString(),
      type: alertType as any,
      downtimeDuration: downtimeInfo.downtimeDuration,
      offTimestamp: downtimeInfo.offTimestamp,
      onTimestamp: downtimeInfo.onTimestamp,
      isStatusUpdate: isStatusUpdate
    };
    
    setCurrentAlerts(prev => {
      if (isStatusUpdate) {
        const filtered = prev.filter(a => 
          !(a.type === 'offline-status' && a.machineId === newAlert.machineId)
        );
        const updatedAlerts = [...filtered, newAlert];
        console.log('Updated offline status alerts:', updatedAlerts.length);
        return updatedAlerts;
      } else {
        const exists = prev.some(a => 
          a.type === 'downtime' && 
          a.machineId === newAlert.machineId && 
          a.offTimestamp === newAlert.offTimestamp &&
          a.onTimestamp === newAlert.onTimestamp
        );
        
        if (exists) {
          return prev;
        }
        
        const updatedAlerts = [...prev, newAlert];
        console.log('Updated downtime alerts:', updatedAlerts.length);
        return updatedAlerts;
      }
    });
    
    setAlertCount(prev => prev + 1);
    setShowAlerts(true);
  };

  const clearAlerts = () => {
    setCurrentAlerts([]);
    setAlertCount(0);
    setShowAlerts(false);
  };

  return {
    alertCount,
    showAlerts,
    setShowAlerts,
    currentAlerts,
    clearAlerts,
    checkForAlerts,
    processAlert,
    addStateChangeAlert,
    addDowntimeAlert
  };
};
