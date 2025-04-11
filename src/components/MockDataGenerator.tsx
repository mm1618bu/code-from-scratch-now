
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { notifyMachineStateChange } from '@/lib/notification';
import { supabase } from '@/lib/supabase';

// Define machine states for random selection
const MACHINE_STATES = ['running', 'idle', 'error', 'maintenance', 'standby'];
const MACHINE_IDS = ['MACH001', 'MACH002', 'MACH003', 'MACH004', 'MACH005'];

const MockDataGenerator = () => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [intervalId, setIntervalId] = useState<number | null>(null);

  // Helper function to get a random item from an array
  const getRandomItem = <T,>(array: T[]): T => {
    return array[Math.floor(Math.random() * array.length)];
  };

  // Generate a simulated state change and update the database
  const generateStateChange = async () => {
    const machineId = getRandomItem(MACHINE_IDS);
    const previousState = getRandomItem(MACHINE_STATES);
    let newState = getRandomItem(MACHINE_STATES);
    
    // Make sure the new state is different from the previous state
    while (newState === previousState) {
      newState = getRandomItem(MACHINE_STATES);
    }
    
    // Create state change object
    const stateChange = {
      machineId,
      previousState,
      newState,
      timestamp: new Date().toISOString()
    };
    
    try {
      // Update the database with the new state
      const { error } = await supabase
        .from('liveData')
        .upsert({
          machineId: machineId,
          state: newState,
          created_at: new Date().toISOString(),
          _id: machineId, // Using machineId as the primary key for simplicity
          state_duration: Math.floor(Math.random() * 3600), // Random duration in seconds
          total_current: Math.random() * 10, // Random current value
          CT_Avg: Math.random() * 5, // Random average current
          CT1: Math.random() * 6, 
          CT2: Math.random() * 6,
          CT3: Math.random() * 6,
          fw_version: 1.0,
          fault_status: newState === 'error' ? 'fault_detected' : 'normal',
          mac: `00:1A:2B:${machineId.slice(-2)}:FF:EE`
        });
      
      if (error) {
        console.error('Error updating database:', error);
        throw error;
      }
      
      console.log(`Database updated for machine ${machineId}: state changed to ${newState}`);
      
      // Send notifications after successful database update
      notifyMachineStateChange(stateChange);
      
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
