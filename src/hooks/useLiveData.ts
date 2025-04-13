
import { useCallback } from 'react';
import { useAlerts } from '@/hooks/useAlerts';
import { useDataFetching } from '@/hooks/useDataFetching';
import { useDataFiltering } from '@/hooks/useDataFiltering';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { MachineDowntimeNotification } from '@/lib/notification';

export const useLiveData = () => {
  const {
    alertCount,
    showAlerts,
    setShowAlerts,
    currentAlerts,
    clearAlerts,
    checkForAlerts,
    processAlert,
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

  // Define callback for downtime alerts
  const handleDowntimeAlert = useCallback((downtimeInfo: MachineDowntimeNotification) => {
    console.log('Handling downtime alert:', downtimeInfo);
    
    // Only display the alert if it's a significant downtime (more than 0 minutes)
    if (downtimeInfo.downtimeDuration > 0) {
      addDowntimeAlert(downtimeInfo);
      
      // Automatically open the alerts panel for downtime notifications
      setShowAlerts(true);
    }
  }, [addDowntimeAlert, setShowAlerts]);

  // Set up realtime for alert processing only including downtime alerts
  useSupabaseRealtime(
    () => {
      console.log('This function is never called - alerts only');
    }, 
    processAlert, // Process high current alerts
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
