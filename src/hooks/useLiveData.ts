
import { useCallback, useEffect } from 'react';
import { useAlerts } from '@/hooks/useAlerts';
import { useDataFetching } from '@/hooks/useDataFetching';
import { useDataFiltering } from '@/hooks/useDataFiltering';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { MachineDowntimeNotification } from '@/lib/notification';
import { LiveDataItem } from '@/types/liveData';
import { useToast } from '@/hooks/use-toast';

export const useLiveData = () => {
  const { toast } = useToast();

  const {
    alertCount,
    showAlerts,
    setShowAlerts,
    currentAlerts,
    clearAlerts,
    checkForAlerts,
    processAlert,
    addStateChangeAlert,
    addDowntimeAlert
  } = useAlerts();

  const {
    liveData,
    loading,
    fetchLiveData,
    fetchInitialData
  } = useDataFetching(checkForAlerts);

  const {
    stateFilter,
    setStateFilter,
    machineIdFilter,
    setMachineIdFilter,
    currentPage,
    setCurrentPage,
    sortDirection,
    setSortDirection,
    uniqueStates,
    uniqueMachineIds,
    filteredData,
    totalPages,
    currentData,
    itemsPerPage
  } = useDataFiltering(liveData);

  // Log when alerts are updated
  useEffect(() => {
    if (currentAlerts.length > 0) {
      console.log('Current alerts in useLiveData:', currentAlerts);
    }
  }, [currentAlerts]);

  // Handle new records for alerts
  const handleNewAlert = useCallback((data: LiveDataItem) => {
    console.log('New alert data received:', data);
    
    // Process the alert
    processAlert(data);
    
    // Check if there are state changes (handled by the Supabase realtime subscription)
    if (data.state) {
      console.log(`Machine ${data.machineId} state is ${data.state}`);
    }
    
    // For high current values, also show a toast
    if (data.total_current >= 15.0) {
      toast({
        title: `High Current: ${data.machineId}`,
        description: `Current value: ${data.total_current.toFixed(2)} A`,
        variant: "destructive"
      });
    }
  }, [processAlert, toast]);

  // Define callback for downtime alerts
  const handleDowntimeAlert = useCallback((downtimeInfo: MachineDowntimeNotification) => {
    console.log('Handling downtime alert:', downtimeInfo);
    
    // Only display the alert if it's a significant downtime (more than 0 minutes)
    if (downtimeInfo.downtimeDuration > 0) {
      addDowntimeAlert(downtimeInfo);
      
      // Show a toast for downtime
      toast({
        title: `Downtime Alert: ${downtimeInfo.machineId}`,
        description: `Offline for ${downtimeInfo.downtimeDuration} minutes`,
        variant: "warning"
      });
      
      // Automatically open the alerts panel for downtime notifications
      setShowAlerts(true);
    }
  }, [addDowntimeAlert, setShowAlerts, toast]);

  // Set up realtime for alerts processing
  useSupabaseRealtime(
    () => {
      console.log('This function is never called - alerts only');
    }, 
    handleNewAlert, // Process high current alerts
    handleDowntimeAlert // Process downtime alerts
  );

  return {
    // Data fetching
    liveData,
    loading,
    fetchLiveData,
    fetchInitialData,
    
    // Filtering and pagination
    stateFilter,
    setStateFilter,
    machineIdFilter,
    setMachineIdFilter,
    currentPage,
    setCurrentPage,
    sortDirection,
    setSortDirection,
    uniqueStates,
    uniqueMachineIds,
    filteredData,
    totalPages,
    currentData,
    itemsPerPage,
    
    // Alerts
    alertCount,
    showAlerts,
    setShowAlerts,
    currentAlerts,
    clearAlerts
  };
};
