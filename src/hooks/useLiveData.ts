
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
    fetchLiveData
  } = useDataFetching(checkForAlerts);

  const {
    stateFilter,
    setStateFilter,
    currentPage,
    setCurrentPage,
    uniqueStates,
    filteredData,
    totalPages,
    currentData,
    itemsPerPage
  } = useDataFiltering(liveData);

  const handleFetchData = useCallback(() => {
    fetchLiveData();
  }, [fetchLiveData]);

  useSupabaseRealtime(handleFetchData, processAlert);

  return {
    // Data fetching
    liveData,
    loading,
    fetchLiveData,
    
    // Filtering and pagination
    stateFilter,
    setStateFilter,
    currentPage,
    setCurrentPage,
    uniqueStates,
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
