
import { useState, useEffect } from 'react';
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
  isForceOfflineMachine,
  clearForceOfflineMachine
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
        .select('state')
        .eq('machineId', machineId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      const previousState = currentData?.state || getRandomItem(MACHINE_STATES);
      
      // Check if this machine is being forced offline
      let newState = previousState;
      let offlineStartTime: string | null = null;
      
      if (isForceOfflineMachine(machineId)) {
        newState = 'off';
      } else if (previousState === 'off') {
        // Machine was previously off, now check if we should turn it back on
        offlineStartTime = clearForceOfflineMachine(machineId);
        if (offlineStartTime) {
          // If we forced this machine offline before, now turn it back on
          newState = getRandomItem(MACHINE_STATES.filter(state => state !== 'off'));
          
          // Calculate the downtime duration in minutes
          const startTime = new Date(offlineStartTime);
          const endTime = new Date();
          const downtimeMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
          
          // Send alert notification for machine coming back online
          toast({
            title: `Machine ${machineId} is Back Online`,
            description: `The machine was offline for ${downtimeMinutes} minutes`,
            variant: "default",
          });
          
          // Log the downtime event
          console.log(`Machine ${machineId} was offline for ${downtimeMinutes} minutes from ${startTime.toLocaleString()} to ${endTime.toLocaleString()}`);
        } else {
          // If it wasn't forced offline, just get a random new state
          newState = getRandomItem(MACHINE_STATES);
        }
      } else {
        // Regular state change logic
        newState = getRandomItem(MACHINE_STATES);
      }
      
      // Initialize current values
      let ct1, ct2, ct3, ctAvg, totalCurrent;
      
      // If state is "off", set all current values to 0
      if (newState === 'off') {
        ct1 = 0;
        ct2 = 0;
        ct3 = 0;
        ctAvg = 0;
        totalCurrent = 0;
      } else {
        // Generate random values for currents when state is not "off"
        ct1 = getRandomFloat(0, 6.0);
        ct2 = getRandomFloat(0, 6.0);
        ct3 = Math.floor(getRandomFloat(0, 6.0)); // Integer for CT3 (bigint in DB)
        ctAvg = getRandomFloat(0, 15.0); // Keep CT_Avg within normal range
        
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
        totalCurrent // Add total current to the state change object
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

  // Function to force MACH001 offline for 3 minutes
  const forceMachine1OfflineFor3Minutes = () => {
    const machineId = 'MACH001';
    
    // Force the machine offline
    toast({
      title: `Forcing ${machineId} Offline`,
      description: "Machine will be offline for 3 minutes",
      variant: "default",
    });
    
    // Store the start time and set machine to forced offline
    localStorage.setItem(`force_offline_${machineId}`, 'true');
    localStorage.setItem(`offline_start_${machineId}`, new Date().toISOString());
    
    // Set a timeout to clear the force offline after 3 minutes
    setTimeout(() => {
      // The next data generation will handle turning the machine back on
    }, 3 * 60 * 1000); // 3 minutes in milliseconds
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
      
      // Force MACH001 offline for 3 minutes as per use case
      forceMachine1OfflineFor3Minutes();
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
