
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { notifyMachineStateChange, notifyTotalCurrentThresholdAlert } from '@/lib/notification';
import { 
  MACHINE_IDS, 
  MACHINE_STATES, 
  FAULT_STATUSES,
  TOTAL_CURRENT_THRESHOLD,
  getRandomItem,
  getRandomFloat,
  generatePossiblyHighTotalCurrent,
  forceOfflineMachine,
  isForceOfflineMachine,
  clearForceOfflineMachine
} from '@/utils/mockDataUtils';

export const useMockDataGenerator = () => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [intervalId, setIntervalId] = useState<number | null>(null);
  const [demoUseCase, setDemoUseCase] = useState(false);
  const startTimeRef = useRef<Date | null>(null);

  // Store the start time of the demo use case
  const startDemoUseCase = () => {
    // Force MACH001 to be offline
    forceOfflineMachine('MACH001');
    startTimeRef.current = new Date();
    setDemoUseCase(true);
    
    // Set a timeout to end the demo case after 3 minutes
    setTimeout(() => {
      clearForceOfflineMachine('MACH001');
      setDemoUseCase(false);
      // The notification will be triggered by the next data generation cycle
    }, 3 * 60 * 1000); // 3 minutes
    
    toast({
      title: "Demo Use Case Started",
      description: "MACH001 will be offline for 3 minutes with zero current values",
    });
  };

  // Generate a simulated state change and update the database
  const generateStateChange = async () => {
    // Generate a new timestamp at the exact moment this function runs
    const currentTimestamp = new Date();
    
    // Choose which machine to update
    let machineId = getRandomItem(MACHINE_IDS);
    let isForced = false;
    
    // Check if MACH001 is forced offline
    if (isForceOfflineMachine('MACH001')) {
      // For the demo case, force the machine to be MACH001
      machineId = 'MACH001';
      isForced = true;
    }
    
    try {
      // Get the current state for this machine to use as previous state
      const { data: currentData } = await supabase
        .from('liveData')
        .select('state')
        .eq('machineId', machineId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      const previousState = currentData?.state || getRandomItem(MACHINE_STATES);
      
      // Determine new state based on whether the machine is forced offline
      let newState;
      if (isForced) {
        newState = 'off'; // Force machine to be off for our demo case
      } else {
        // Check if this is MACH001 that was just brought back online
        if (machineId === 'MACH001' && previousState === 'off' && startTimeRef.current) {
          newState = getRandomItem(MACHINE_STATES.filter(state => state !== 'off')); // Ensure it comes back online
          
          // Calculate how long it was offline
          const offlineDuration = Math.round((currentTimestamp.getTime() - startTimeRef.current.getTime()) / (60 * 1000));
          
          // Reset the start time
          startTimeRef.current = null;
          
          // Display toast for the machine coming back online
          toast({
            title: "Machine Back Online",
            description: `MACH001 is now online after being offline for approximately ${offlineDuration} minutes`,
          });
        } else {
          // Normal operation - pick a random state different from the previous
          newState = getRandomItem(MACHINE_STATES);
          while (newState === previousState) {
            newState = getRandomItem(MACHINE_STATES);
          }
        }
      }
      
      // Generate values based on state
      // If state is "off", all current values should be 0
      const isOff = newState === 'off';
      
      // Generate random values for currents or zero if machine is off
      const ct1 = isOff ? 0 : getRandomFloat(0, 6.0);
      const ct2 = isOff ? 0 : getRandomFloat(0, 6.0);
      const ct3 = isOff ? 0 : Math.floor(getRandomFloat(0, 6.0)); // Integer for CT3 (bigint in DB)
      
      const ctAvg = isOff ? 0 : getRandomFloat(0, 15.0); // Keep CT_Avg within normal range
      
      // Total current will be 0 if state is off, otherwise use normal logic
      const totalCurrent = isOff ? 0 : generatePossiblyHighTotalCurrent();
      
      const faultStatus = isOff ? 'normal' : getRandomItem(FAULT_STATUSES);
      
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
      
      // Only send state change notifications when generating mock data
      notifyMachineStateChange(stateChange);
      
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
      setDemoUseCase(false);
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
      
      // Start the demo use case
      startDemoUseCase();
    }
    
    setIsGenerating(!isGenerating);
  };

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
      }
      setDemoUseCase(false);
    };
  }, [intervalId]);

  return {
    isGenerating,
    toggleDataGeneration,
    demoUseCase
  };
};
