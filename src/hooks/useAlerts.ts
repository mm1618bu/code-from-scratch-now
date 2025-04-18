
import { useState, useEffect } from 'react';
import { AlertItem } from '@/components/LiveData/AlertMenu';
import { notifyTotalCurrentThresholdAlert } from '@/lib/notification';
import { LiveDataItem } from '@/types/liveData';
import { MachineDowntimeNotification } from '@/lib/notification';
import { useToast } from '@/hooks/use-toast';

export const useAlerts = () => {
  const [alertCount, setAlertCount] = useState(0);
  const [showAlerts, setShowAlerts] = useState(false);
  const [currentAlerts, setCurrentAlerts] = useState<AlertItem[]>([]);
  const { toast } = useToast();

  // Announce new alerts with toast notifications
  useEffect(() => {
    if (currentAlerts.length > 0) {
      console.log('Current alerts available:', currentAlerts.length);
      
      // Only show toast for the most recent alert if there are new alerts
      const latestAlert = currentAlerts[currentAlerts.length - 1];
      
      if (latestAlert) {
        let alertTitle = '';
        let alertDescription = '';
        let alertVariant: 'default' | 'destructive' | 'success' | 'warning' | 'info' = 'default';
        
        if (latestAlert.type === 'high-current') {
          alertTitle = `High Current Alert: ${latestAlert.machineId}`;
          alertDescription = `Current value: ${latestAlert.value?.toFixed(2)} A`;
          alertVariant = 'destructive';
        } else if (latestAlert.type === 'downtime') {
          alertTitle = `Downtime Alert: ${latestAlert.machineId}`;
          alertDescription = `Offline for ${latestAlert.downtimeDuration} minutes`;
          alertVariant = 'warning';
        } else if (latestAlert.type === 'offline-status') {
          alertTitle = `${latestAlert.machineId} Still Offline`;
          alertDescription = `Offline for ${latestAlert.downtimeDuration} minutes and counting`;
          alertVariant = 'info';
        }
        
        // Show toast notification
        toast({
          title: alertTitle,
          description: alertDescription,
          variant: alertVariant
        });
      }
    }
  }, [currentAlerts.length]);

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
      
      // Show alerts panel if we have alerts
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

  const addDowntimeAlert = (downtimeInfo: MachineDowntimeNotification) => {
    // Create a unique key for offline status updates
    const isStatusUpdate = !downtimeInfo.onTimestamp || downtimeInfo.onTimestamp === downtimeInfo.offTimestamp;
    const alertType = isStatusUpdate ? 'offline-status' : 'downtime';
    
    const newAlert: AlertItem = {
      machineId: downtimeInfo.machineId,
      timestamp: new Date(isStatusUpdate ? downtimeInfo.offTimestamp : downtimeInfo.onTimestamp).toLocaleString(),
      type: alertType as any, // Type casting as the AlertItem type needs to be updated
      downtimeDuration: downtimeInfo.downtimeDuration,
      offTimestamp: downtimeInfo.offTimestamp,
      onTimestamp: downtimeInfo.onTimestamp,
      isStatusUpdate: isStatusUpdate
    };
    
    setCurrentAlerts(prev => {
      // For status updates, replace any existing status update for the same machine
      if (isStatusUpdate) {
        // Remove any previous status updates for this machine
        const filtered = prev.filter(a => 
          !(a.type === 'offline-status' && a.machineId === newAlert.machineId)
        );
        const updatedAlerts = [...filtered, newAlert];
        console.log('Updated offline status alerts:', updatedAlerts.length);
        return updatedAlerts;
      } else {
        // For actual downtime alerts, check for duplicates
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
