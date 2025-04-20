
import { useCallback, useEffect } from 'react';
import { useAlerts } from '@/hooks/useAlerts';
import { useDataFetching } from '@/hooks/useDataFetching';
import { useDataFiltering } from '@/hooks/useDataFiltering';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { MachineDowntimeNotification } from '@/lib/notification';
import { LiveDataItem } from '@/types/liveData';

export const useLiveData = () => {
  const {
    alertCount,
    showAlerts,
    setShowAlerts,
    currentAlerts,
    clearAlerts,
    checkForAlerts,
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

  useEffect(() => {
    if (currentAlerts.length > 0) {
      console.log('Current alerts in useLiveData:', currentAlerts);
    }
  }, [currentAlerts]);

  const handleNewAlert = useCallback((data: LiveDataItem) => {
    console.log('New alert data received:', data);
    
    // Instead of using processAlert which was removed,
    // We'll use checkForAlerts which processes both machine-on and high-current alerts
    checkForAlerts([data]);
    
    if (data.state) {
      console.log(`Machine ${data.machineId} state is ${data.state}`);
    }
  }, [checkForAlerts]);

  const handleDowntimeAlert = useCallback((downtimeInfo: MachineDowntimeNotification) => {
    console.log('Handling downtime alert:', downtimeInfo);
    
    if (downtimeInfo.downtimeDuration > 0) {
      addDowntimeAlert(downtimeInfo);
      setShowAlerts(true);
    }
  }, [addDowntimeAlert, setShowAlerts]);

  useSupabaseRealtime(
    () => {},
    handleNewAlert,
    handleDowntimeAlert
  );

  return {
    liveData,
    loading,
    fetchLiveData,
    fetchInitialData,
    
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
    
    alertCount,
    showAlerts,
    setShowAlerts,
    currentAlerts,
    clearAlerts
  };
};
