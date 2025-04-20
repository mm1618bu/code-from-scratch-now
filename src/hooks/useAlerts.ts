
import { useState, useEffect } from 'react';
import { AlertItem } from '@/components/LiveData/AlertMenu';
import { notifyTotalCurrentThresholdAlert } from '@/lib/notification';
import { LiveDataItem } from '@/types/liveData';
import { MachineDowntimeNotification } from '@/lib/notification';
import { useToast } from '@/hooks/use-toast';

export interface AlertDetails {
  machineId: string;
  value?: number;
  timestamp: string;
  type: 'high-current' | 'downtime' | 'offline-status' | 'machine-on';
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
}

const formatTimestamp = (timestamp: string) => {
  try {
    return new Date(timestamp).toLocaleString();
  } catch {
    return new Date().toLocaleString();
  }
};

export const useAlerts = () => {
  const [alertCount, setAlertCount] = useState(0);
  const [showAlerts, setShowAlerts] = useState(false);
  const [currentAlerts, setCurrentAlerts] = useState<AlertDetails[]>([]);
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
    data.forEach((item) => {
      if (item.total_current >= 1.0) {
        processMachineOnAlert(item);
      }
      if (item.total_current >= 15.0) {
        processHighCurrentAlert(item);
      }
    });
  };

  const processMachineOnAlert = (newData: LiveDataItem) => {
    console.log(`Machine ON detected for ${newData.machineId}: ${newData.total_current}A`);
    const newAlert = {
      machineId: newData.machineId,
      value: newData.total_current,
      timestamp: formatTimestamp(newData.created_at),
      type: 'machine-on' as const
    };
    
    setCurrentAlerts(prev => {
      const key = `machine-on-${newAlert.machineId}`;
      const filtered = prev.filter(a => !(a.type === 'machine-on' && a.machineId === newAlert.machineId));
      return [...filtered, newAlert];
    });
    
    setAlertCount(prev => prev + 1);
    setShowAlerts(true);
  };

  const processHighCurrentAlert = (newData: LiveDataItem) => {
    console.log(`High current detected for ${newData.machineId}: ${newData.total_current}A`);
    const newAlert = {
      machineId: newData.machineId,
      value: newData.total_current,
      timestamp: formatTimestamp(newData.created_at),
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
  };

  const addDowntimeAlert = (downtimeInfo: MachineDowntimeNotification) => {
    const isStatusUpdate = !downtimeInfo.onTimestamp || downtimeInfo.onTimestamp === downtimeInfo.offTimestamp;
    const alertType = isStatusUpdate ? 'offline-status' : 'downtime';
    
    console.log(`Adding ${alertType} alert for ${downtimeInfo.machineId}, duration: ${downtimeInfo.downtimeDuration} minutes`);
    
    const newAlert: AlertItem = {
      machineId: downtimeInfo.machineId,
      timestamp: formatTimestamp(isStatusUpdate ? downtimeInfo.offTimestamp : downtimeInfo.onTimestamp),
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
        return [...filtered, newAlert];
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
        
        return [...prev, newAlert];
      }
    });
    
    setAlertCount(prev => prev + 1);
    setShowAlerts(true);
  };

  const clearAlerts = (type?: string) => {
    if (type) {
      setCurrentAlerts((prev) => prev.filter((alert) => alert.type !== type));
    } else {
      setCurrentAlerts([]);
    }
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
    addDowntimeAlert
  };
};
