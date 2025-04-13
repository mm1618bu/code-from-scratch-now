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
  const [simulatingDowntime, setSimulatingDowntime] = useState(false);
  const [downtimeMachineId, setDowntimeMachineId] = useState('');
  const [downtimeCount, setDowntimeCount] = useState(0);

  // Generate a simulated state change and update the database
  const generateStateChange = async () => {
    // Generate a new timestamp at the exact moment this function runs
    const currentTimestamp = new Date();
    
    try {
      // If we're simulating downtime, use the selected machine ID
      const machineId = simulatingDowntime ? downtimeMachineId : getRandomItem(MACHINE_IDS);
      
      // Get the current state for this machine to use as previous state
      const { data: currentData } = await supabase
        .from('liveData')
        .select('state, CT1, CT2, CT3, total_current')
        .eq('machineId', machineId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      const previousState = currentData?.state || getRandomItem(MACHINE_STATES);
      
      // Generate appropriate current values
      let ct1, ct2, ct3, ctAvg, totalCurrent, newState;
      
      // If we are simulating downtime and in downtime phase (counts 0-2 are offline)
      if (simulatingDowntime) {
        // Machine is in downtime phase (first 3 records should be offline)
        if (downtimeCount < 3) {
          // Machine is offline - all currents are zero
          ct1 = 0;
          ct2 = 0;
          ct3 = 0;
          ctAvg = 0;
          totalCurrent = 0;
          newState = 'off'; // Use "off" state specifically for offline machines
          setDowntimeCount(prev => prev + 1);
          console.log(`Simulating machine ${machineId} in offline state (${downtimeCount + 1}/3)`);
        } else if (downtimeCount >= 3 && downtimeCount < 6) {
          // Machine is coming back online
          ct1 = getRandomFloat(0.5, 6.0);
          ct2 = getRandomFloat(0.5, 6.0);
          ct3 = Math.floor(getRandomFloat(0.0, 6.0));
          ctAvg = getRandomFloat(0.5, 15.0);
          totalCurrent = getRandomFloat(1.5, 15.0);
          newState = 'running'; // Machine should be in running state when back online
          setDowntimeCount(prev => prev + 1);
          console.log(`Simulating machine ${machineId} back online (${downtimeCount - 2}/3)`);
          
          // End simulation after 6 cycles (3 offline, 3 online)
          if (downtimeCount === 5) {
            console.log('Downtime simulation complete, returning to normal mock data generation');
            setSimulatingDowntime(false);
            setDowntimeCount(0);
            setDowntimeMachineId('');
            
            toast({
              title: "Downtime Simulation Complete",
              description: `Machine ${machineId} has gone through offline and online states`,
            });
          }
        }
      } else {
        // Regular mock data generation (not simulating downtime)
        // Decide if we should start a new downtime simulation (10% chance)
        if (Math.random() < 0.1 && !simulatingDowntime) {
          // Start a new downtime simulation
          setSimulatingDowntime(true);
          setDowntimeCount(0);
          setDowntimeMachineId(machineId);
          
          // Machine goes offline in the first record
          ct1 = 0;
          ct2 = 0;
          ct3 = 0;
          ctAvg = 0;
          totalCurrent = 0;
          newState = 'off'; // Use "off" state specifically for offline machines
          
          console.log(`Starting downtime simulation for machine ${machineId}`);
        } else {
          // Generate random values for regular simulation
          ct1 = getRandomFloat(0.5, 6.0);
          ct2 = getRandomFloat(0.5, 6.0);
          ct3 = Math.floor(getRandomFloat(0.0, 6.0)); // Integer for CT3 (bigint in DB)
          ctAvg = getRandomFloat(0.5, 15.0); // Keep CT_Avg within normal range
          totalCurrent = generatePossiblyHighTotalCurrent();
          newState = getRandomItem(MACHINE_STATES);
          
          // Make sure the new state is different from the previous state
          while (newState === previousState) {
            newState = getRandomItem(MACHINE_STATES);
          }
        }
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
      if (ct1 === 0 && ct2 === 0 && ct3 === 0 && totalCurrent === 0 && currentData && !isMachineOffline(currentData)) {
        console.log(`Machine ${machineId} is going offline`);
        trackMachineOffline(machineId, insertTimestamp.toISOString());
      }
      
      // Check if machine is coming back online after being offline
      if (!(ct1 === 0 && ct2 === 0 && ct3 === 0 && totalCurrent === 0) && currentData && isMachineOffline(currentData)) {
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
      setSimulatingDowntime(false);
      setDowntimeCount(0);
      setDowntimeMachineId('');
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
        description: "Generating one random machine state change every 5 seconds. Will simulate machine downtime scenarios."
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
