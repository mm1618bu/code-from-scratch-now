
import { useCallback } from 'react';
import { useAlerts } from '@/hooks/useAlerts';
import { useDataFetching } from '@/hooks/useDataFetching';
import { useDataFiltering } from '@/hooks/useDataFiltering';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';

export const useLiveData = () => {
  const {
    alertCount,
    showAlerts,
    setShowAlerts,
    currentAlerts,
    clearAlerts,
    checkForAlerts,
    processAlert
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
    uniqueStates,
    uniqueMachineIds,
    filteredData,
    totalPages,
    currentData,
    itemsPerPage
  } = useDataFiltering(liveData);

  // Set up realtime for alert processing only
  // The auto-refresh is handled through the interval in useDataFetching
  useSupabaseRealtime(
    () => {
      console.log('This function is never called - alerts only');
    }, 
    processAlert // Only process alerts
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
