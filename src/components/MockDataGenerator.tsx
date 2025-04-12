
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { notifyMachineStateChange, notifyTotalCurrentThresholdAlert } from '@/lib/notification';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

// Define machine states for random selection
const MACHINE_STATES = ['running', 'idle', 'error', 'maintenance', 'standby'];
const MACHINE_IDS = ['MACH001', 'MACH002', 'MACH003', 'MACH004', 'MACH005'];
const FAULT_STATUSES = ['fault_detected', 'normal', 'warning', 'critical'];
const TOTAL_CURRENT_THRESHOLD = 15.0; // Threshold for Total Current alert

const MockDataGenerator = () => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [intervalId, setIntervalId] = useState<number | null>(null);
  const [lastTimestamp, setLastTimestamp] = useState(new Date());

  // Helper function to get a random item from an array
  const getRandomItem = <T,>(array: T[]): T => {
    return array[Math.floor(Math.random() * array.length)];
  };

  // Helper function to get a random float between min and max, with precision
  const getRandomFloat = (min: number, max: number, precision: number = 2): number => {
    const value = Math.random() * (max - min) + min;
    return parseFloat(value.toFixed(precision));
  };

  // Helper function to occasionally generate high Total Current values
  const generatePossiblyHighTotalCurrent = (): number => {
    // 20% chance to generate a value above threshold
    if (Math.random() < 0.2) {
      return getRandomFloat(TOTAL_CURRENT_THRESHOLD, TOTAL_CURRENT_THRESHOLD + 10.0);
    }
    // Otherwise generate normal value
    return getRandomFloat(1.5, TOTAL_CURRENT_THRESHOLD - 1.0);
  };

  // Generate a simulated state change and update the database
  const generateStateChange = async () => {
    // Update the timestamp by adding 5 seconds
    const newTimestamp = new Date(lastTimestamp.getTime() + 5000);
    setLastTimestamp(newTimestamp);
    
    // Generate mock data similar to the Python script
    const machineId = getRandomItem(MACHINE_IDS);
    
    try {
      // Get the current state for this machine
      const { data: currentData } = await supabase
        .from('liveData')
        .select('state, _id')
        .eq('machineId', machineId)
        .maybeSingle();
      
      const previousState = currentData?.state || getRandomItem(MACHINE_STATES);
      let newState = getRandomItem(MACHINE_STATES);
      
      // Make sure the new state is different from the previous state
      while (newState === previousState) {
        newState = getRandomItem(MACHINE_STATES);
      }
      
      // Generate random values for currents
      const ct1 = getRandomFloat(0.5, 6.0);
      const ct2 = getRandomFloat(0.5, 6.0);
      const ct3 = Math.floor(getRandomFloat(0.0, 6.0)); // Integer for CT3 (bigint in DB)
      
      const ctAvg = getRandomFloat(0.5, 15.0); // Keep CT_Avg within normal range
      
      // Use our helper function that might generate high values for Total Current
      const totalCurrent = generatePossiblyHighTotalCurrent();
      
      const faultStatus = getRandomItem(FAULT_STATUSES);
      
      // Create state change object for notification
      const stateChange = {
        machineId,
        previousState,
        newState,
        timestamp: newTimestamp.toISOString()
      };
      
      // Prepare the data update
      const dataUpdate = {
        machineId: machineId,
        state: newState,
        created_at: newTimestamp.toISOString(),
        state_duration: Math.floor(Math.random() * 3600),
        total_current: totalCurrent,
        CT_Avg: ctAvg,
        CT1: ct1,
        CT2: ct2,
        CT3: ct3,
        fw_version: getRandomFloat(1.0, 5.0, 1),
        fault_status: faultStatus,
        mac: `00:1A:2B:${machineId.slice(-2)}:FF:EE`,
        hi: Math.floor(Math.random() * 100).toString()
      };
      
      let error;
      
      if (currentData && currentData._id) {
        // Update existing record
        console.log(`Updating existing record for machine ${machineId} with ID ${currentData._id}`);
        const { error: updateError } = await supabase
          .from('liveData')
          .update(dataUpdate)
          .eq('_id', currentData._id);
          
        error = updateError;
      } else {
        // Insert new record if none exists
        console.log(`Creating new record for machine ${machineId}`);
        const { error: insertError } = await supabase
          .from('liveData')
          .insert({
            ...dataUpdate,
            _id: uuidv4() // Generate a unique ID for new records
          });
          
        error = insertError;
      }
      
      if (error) {
        console.error('Error updating database:', error);
        throw error;
      }
      
      console.log(`Database updated for machine ${machineId}: state changed to ${newState}`);
      
      // Send notifications after successful database update
      notifyMachineStateChange(stateChange);
      
      // Check if Total Current exceeds threshold and send alert notification
      if (totalCurrent >= TOTAL_CURRENT_THRESHOLD) {
        console.log(`Total Current threshold exceeded for machine ${machineId}: ${totalCurrent}`);
        notifyTotalCurrentThresholdAlert({
          machineId,
          totalCurrent,
          timestamp: newTimestamp.toISOString()
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
        description: "No longer generating random machine state changes"
      });
    } else {
      // Start generation
      const id = setInterval(generateStateChange, 5000) as unknown as number;
      setIntervalId(id);
      toast({
        title: "Mock Data Generation Started",
        description: "Generating random machine state changes every 5 seconds"
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

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={toggleDataGeneration}
        className={`px-4 py-2 rounded-full text-white shadow-lg flex items-center ${
          isGenerating ? 'bg-red-500 hover:bg-red-600' : 'bg-sage hover:bg-sage/90'
        }`}
      >
        <span className={`w-3 h-3 rounded-full mr-2 ${isGenerating ? 'bg-white animate-pulse' : 'bg-white'}`}></span>
        {isGenerating ? 'Stop Mock Data' : 'Start Mock Data'}
      </button>
    </div>
  );
};

export default MockDataGenerator;
