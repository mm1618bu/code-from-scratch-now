import { useCallback } from 'react';
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

  useEffect(() => {
    if (currentAlerts.length > 0) {
      console.log('Current alerts in useLiveData:', currentAlerts);
    }
  }, [currentAlerts]);

  const handleNewAlert = useCallback((data: LiveDataItem) => {
    console.log('New alert data received:', data);
    
    processAlert(data);
    
    if (data.state) {
      console.log(`Machine ${data.machineId} state is ${data.state}`);
    }
    
    if (data.total_current >= 15.0) {
      toast({
        title: `High Current: ${data.machineId}`,
        description: `Current value: ${data.total_current.toFixed(2)} A`,
        variant: "destructive"
      });
    }
  }, [processAlert, toast]);

  const handleDowntimeAlert = useCallback((downtimeInfo: MachineDowntimeNotification) => {
    console.log('Handling downtime alert:', downtimeInfo);
    
    if (downtimeInfo.downtimeDuration > 0) {
      addDowntimeAlert(downtimeInfo);
      
      toast({
        title: `Downtime Alert: ${downtimeInfo.machineId}`,
        description: `Offline for ${downtimeInfo.downtimeDuration} minutes`,
        variant: "warning"
      });
      
      setShowAlerts(true);
    }
  }, [addDowntimeAlert, setShowAlerts, toast]);

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
