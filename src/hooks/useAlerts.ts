
import { useState } from 'react';
import { AlertItem } from '@/components/LiveData/AlertMenu';
import { notifyTotalCurrentThresholdAlert } from '@/lib/notification';
import { LiveDataItem } from '@/types/liveData';

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
        timestamp: new Date(item.created_at).toLocaleString()
      }));
      
      setCurrentAlerts(prev => {
        const combined = [...prev, ...newAlerts];
        const unique = combined.reduce((acc, curr) => {
          acc[curr.machineId] = curr;
          return acc;
        }, {} as Record<string, AlertItem>);
        
        return Object.values(unique);
      });
      
      setAlertCount(prev => prev + highCurrentItems.length);
      
      // We're only adding to the alerts dropdown and not showing toasts
      highCurrentItems.forEach(item => {
        notifyTotalCurrentThresholdAlert({
          machineId: item.machineId,
          totalCurrent: item.total_current,
          timestamp: new Date(item.created_at).toISOString()
        });
      });
      
      // Removed toast notification here
    }
  };

  const processAlert = (newData: LiveDataItem) => {
    if (newData.total_current >= 15.0) {
      const newAlert = {
        machineId: newData.machineId,
        value: newData.total_current,
        timestamp: new Date(newData.created_at).toLocaleString()
      };
      
      setCurrentAlerts(prev => {
        const filtered = prev.filter(a => a.machineId !== newAlert.machineId);
        return [...filtered, newAlert];
      });
      
      setAlertCount(prev => prev + 1);
      
      notifyTotalCurrentThresholdAlert({
        machineId: newData.machineId,
        totalCurrent: newData.total_current,
        timestamp: new Date(newData.created_at).toISOString()
      });
      
      // Removed toast notification here
    }
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
    processAlert
  };
};
