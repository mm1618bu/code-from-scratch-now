
import { useState } from 'react';
import { AlertItem } from '@/components/LiveData/AlertMenu';
import { notifyTotalCurrentThresholdAlert } from '@/lib/notification';
import { LiveDataItem } from '@/types/liveData';
import { MachineDowntimeNotification } from '@/lib/notification';

export const useAlerts = () => {
  const [alertCount, setAlertCount] = useState(0);
  const [showAlerts, setShowAlerts] = useState(false);
  const [currentAlerts, setCurrentAlerts] = useState<AlertItem[]>([]);

  const checkForAlerts = (data: LiveDataItem[]) => {
    const highCurrentItems = data.filter(item => item.total_current >= 15.0);
    
    if (highCurrentItems.length > 0) {
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
    if (newData.total_current >= 15.0) {
      const newAlert = {
        machineId: newData.machineId,
        value: newData.total_current,
        timestamp: new Date(newData.created_at).toLocaleString(),
        type: 'high-current' as const
      };
      
      setCurrentAlerts(prev => {
        const key = `high-current-${newAlert.machineId}`;
        const filtered = prev.filter(a => !(a.type === 'high-current' && a.machineId === newAlert.machineId));
        return [...filtered, newAlert];
      });
      
      setAlertCount(prev => prev + 1);
      
      notifyTotalCurrentThresholdAlert({
        machineId: newData.machineId,
        totalCurrent: newData.total_current,
        timestamp: new Date(newData.created_at).toISOString()
      });
    }
  };

  const addDowntimeAlert = (downtimeInfo: MachineDowntimeNotification) => {
    const newAlert: AlertItem = {
      machineId: downtimeInfo.machineId,
      timestamp: new Date(downtimeInfo.onTimestamp).toLocaleString(),
      type: 'downtime',
      downtimeDuration: downtimeInfo.downtimeDuration,
      offTimestamp: downtimeInfo.offTimestamp,
      onTimestamp: downtimeInfo.onTimestamp
    };
    
    setCurrentAlerts(prev => {
      // Make sure we don't add duplicate downtime alerts for the same machine and timeframe
      const key = `downtime-${newAlert.machineId}-${newAlert.offTimestamp}`;
      const exists = prev.some(a => 
        a.type === 'downtime' && 
        a.machineId === newAlert.machineId && 
        a.offTimestamp === newAlert.offTimestamp
      );
      
      if (exists) {
        return prev;
      }
      return [...prev, newAlert];
    });
    
    setAlertCount(prev => prev + 1);
    
    // Automatically show the alerts panel when we get a downtime alert
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
    addDowntimeAlert
  };
};
