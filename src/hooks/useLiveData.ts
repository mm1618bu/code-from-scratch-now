
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

  // Only set up realtime for alert processing with an empty function for onFetchData
  // to ensure we don't trigger any refreshes
  useSupabaseRealtime(() => {
    // Empty function to prevent any auto-refresh
    console.log('Alert received but not triggering refresh');
  }, processAlert);

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
