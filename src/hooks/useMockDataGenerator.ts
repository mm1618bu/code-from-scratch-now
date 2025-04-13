
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { 
  notifyMachineStateChange, 
  notifyTotalCurrentThresholdAlert,
  isMachineOffline,
  trackMachineOffline,
  trackMachineOnline
} from '@/lib/notification';
import { 
  MACHINE_IDS, 
  MACHINE_STATES, 
  FAULT_STATUSES,
  TOTAL_CURRENT_THRESHOLD,
  getRandomItem,
  getRandomFloat,
  generatePossiblyHighTotalCurrent
} from '@/utils/mockDataUtils';

export const useMockDataGenerator = () => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [intervalId, setIntervalId] = useState<number | null>(null);

  // Generate a simulated state change and update the database
  const generateStateChange = async () => {
    // Generate a new timestamp at the exact moment this function runs
    const currentTimestamp = new Date();
    
    // Generate mock data similar to the Python script
    const machineId = getRandomItem(MACHINE_IDS);
    
    try {
      // Get the current state for this machine to use as previous state
      const { data: currentData } = await supabase
        .from('liveData')
        .select('state, CT1, CT2, CT3, total_current')
        .eq('machineId', machineId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      const previousState = currentData?.state || getRandomItem(MACHINE_STATES);
      let newState = getRandomItem(MACHINE_STATES);
      
      // Make sure the new state is different from the previous state
      while (newState === previousState) {
        newState = getRandomItem(MACHINE_STATES);
      }
      
      // Decide if the machine should be offline (all currents zero)
      // 15% chance of generating an offline record
      const generateOfflineRecord = Math.random() < 0.15;
      
      // Generate appropriate current values
      let ct1, ct2, ct3, ctAvg, totalCurrent;
      
      if (generateOfflineRecord) {
        // Machine is offline - all currents are zero
        ct1 = 0;
        ct2 = 0;
        ct3 = 0;
        ctAvg = 0;
        totalCurrent = 0;
        newState = 'idle'; // Typically offline machines are in idle state
      } else {
        // Generate random values for currents
        ct1 = getRandomFloat(0.5, 6.0);
        ct2 = getRandomFloat(0.5, 6.0);
        ct3 = Math.floor(getRandomFloat(0.0, 6.0)); // Integer for CT3 (bigint in DB)
        ctAvg = getRandomFloat(0.5, 15.0); // Keep CT_Avg within normal range
        
        // Use our helper function that might generate high values for Total Current
        totalCurrent = generatePossiblyHighTotalCurrent();
      }
      
      const faultStatus = getRandomItem(FAULT_STATUSES);
      
      // Create state change object for notification
      const stateChange = {
        machineId,
        previousState,
        newState,
        timestamp: currentTimestamp.toISOString(),
        totalCurrent
      };
      
      // Create a fresh timestamp for this database operation
      const insertTimestamp = new Date();
      
      // Insert only a single record
      const { error: insertError } = await supabase
        .from('liveData')
        .insert({
          machineId: machineId,
          state: newState,
          created_at: insertTimestamp.toISOString(),
          state_duration: Math.floor(Math.random() * 3600),
          total_current: totalCurrent,
          CT_Avg: ctAvg,
          CT1: ct1,
          CT2: ct2,
          CT3: ct3,
          fw_version: getRandomFloat(1.0, 5.0, 1),
          fault_status: faultStatus,
          mac: `00:1A:2B:${machineId.slice(-2)}:FF:EE`,
          hi: Math.floor(Math.random() * 100).toString(),
          _id: uuidv4() // Generate a unique ID for each new record
        });
      
      if (insertError) {
        console.error('Error inserting new record:', insertError);
        throw insertError;
      }
      
      console.log(`Created new record for machine ${machineId}: state changed to ${newState} at ${insertTimestamp.toISOString()}`);
      
      // Check if we need to track machine going offline
      if (generateOfflineRecord && currentData && !isMachineOffline(currentData)) {
        console.log(`Machine ${machineId} is going offline`);
        trackMachineOffline(machineId, insertTimestamp.toISOString());
      }
      
      // Check if machine is coming back online after being offline
      if (!generateOfflineRecord && currentData && isMachineOffline(currentData)) {
        console.log(`Machine ${machineId} is coming back online after being offline`);
        trackMachineOnline(machineId, insertTimestamp.toISOString());
      }
      
      // Only send state change notifications when generating mock data and it's a significant state change
      if (totalCurrent >= TOTAL_CURRENT_THRESHOLD) {
        notifyMachineStateChange(stateChange);
      }
      
      // Only check for total current threshold when generating mock data
      if (totalCurrent >= TOTAL_CURRENT_THRESHOLD) {
        console.log(`Total Current threshold exceeded for machine ${machineId}: ${totalCurrent}`);
        notifyTotalCurrentThresholdAlert({
          machineId,
          totalCurrent,
          timestamp: insertTimestamp.toISOString()
        });
      }
      
    } catch (error) {
      console.error('Failed to update database:', error);
      toast({
        title: "Database Update Failed",
        description: "Could not update the machine state in the database",
        variant: "destructive"
      });
    }
  };

  // Toggle data generation on/off
  const toggleDataGeneration = () => {
    if (isGenerating) {
      // Stop generation
      if (intervalId !== null) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
      toast({
        title: "Mock Data Generation Stopped",
        description: "No longer generating mock data"
      });
    } else {
      // Start generation - exactly one record every 5 seconds
      const id = setInterval(generateStateChange, 5000) as unknown as number;
      setIntervalId(id);
      toast({
        title: "Mock Data Generation Started",
        description: "Generating one random machine state change every 5 seconds"
      });
      // Generate one immediately
      generateStateChange();
    }
    
    setIsGenerating(!isGenerating);
  };

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  return {
    isGenerating,
    toggleDataGeneration
  };
};
