import { useState, useEffect } from 'react';
import { AlertItem } from '@/components/LiveData/AlertMenu';
import { notifyTotalCurrentThresholdAlert } from '@/lib/notification';
import { LiveDataItem } from '@/types/liveData';
import { MachineDowntimeNotification } from '@/lib/notification';
import { useToast } from '@/hooks/use-toast';

// Extend AlertItem to support previousState and newState for state-change alerts
export interface AlertItem {
  machineId: string;
  value?: number;
  timestamp: string;
  type: 'high-current' | 'downtime' | 'offline-status' | 'state-change' | 'state-update-log';
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
  
  // Add previousState and newState specifically for 'state-change' alerts
  previousState?: string;
  newState?: string;
}

export const useAlerts = () => {
  const [alertCount, setAlertCount] = useState(0);
  const [showAlerts, setShowAlerts] = useState(false);
  const [currentAlerts, setCurrentAlerts] = useState<AlertItem[]>([]);
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
    
    if (newData.total_current >= 15.0) {
      console.log(`High current detected for ${newData.machineId}: ${newData.total_current}A`);
      const newAlert = {
        machineId: newData.machineId,
        value: newData.total_current,
        timestamp: new Date(newData.created_at).toLocaleString(),
        type: 'high-current' as const
      };
      
      setCurrentAlerts(prev => {
        const key = `high-current-${newAlert.machineId}`;
        const filtered = prev.filter(a => !(a.type === 'high-current' && a.machineId === newAlert.machineId));
        const updatedAlerts = [...filtered, newAlert];
        console.log('Updated high current alerts:', updatedAlerts.length);
        return updatedAlerts;
      });
      
      setAlertCount(prev => prev + 1);
      setShowAlerts(true);
      
      notifyTotalCurrentThresholdAlert({
        machineId: newData.machineId,
        totalCurrent: newData.total_current,
        timestamp: new Date(newData.created_at).toISOString()
      });
    }
  };

  const addStateChangeAlert = (machineId: string, previousState: string, newState: string, timestamp: string) => {
    console.log(`Adding state change alert for ${machineId}: ${previousState} → ${newState}`);
    
    const newAlert: AlertItem = {
      machineId,
      previousState,
      newState,
      timestamp: new Date(timestamp).toLocaleString(),
      type: 'state-change' as any
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
