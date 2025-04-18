
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { 
  MACHINE_IDS, 
  MACHINE_STATES,
  FAULT_STATUSES,
  getRandomItem,
  getRandomFloat,
  generatePossiblyHighTotalCurrent
} from '@/utils/mockDataUtils';

export const useMockDataGenerator = () => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [intervalId, setIntervalId] = useState<number | null>(null);
  const [demoUseCase, setDemoUseCase] = useState(false);
  const activeRecordsRef = useRef<Record<string, { 
    recordId: string,
    startTime: Date,
    machineId: string,
    currentState: string,
    stateDuration: number
  }>>({});

  // Generate new random CT values for non-off states
  const generateCTValues = (isOff: boolean) => {
    if (isOff) {
      return {
        ct1: 0,
        ct2: 0,
        ct3: 0,
        ctAvg: 0,
        totalCurrent: 0
      };
    } else {
      // Generate random values that are at least 1.0
      const ct1 = Math.max(1.0, getRandomFloat(1.0, 6.0));
      const ct2 = Math.max(1.0, getRandomFloat(1.0, 6.0));
      const ct3 = Math.max(1.0, getRandomFloat(1.0, 6.0));
      const ctAvg = Math.max(1.0, getRandomFloat(1.0, 15.0));
      const totalCurrent = generatePossiblyHighTotalCurrent();
      
      return {
        ct1,
        ct2,
        ct3,
        ctAvg,
        totalCurrent
      };
    }
  };

  const updateRecordState = async (recordId: string, machineId: string, currentDuration: number) => {
    // Change state every 30 seconds
    if (currentDuration > 0 && currentDuration % 30 === 0) {
      console.log(`Time to change state for ${machineId} at ${currentDuration}s`);
      let newState;
      // For first state change (at 30s), ensure it's not 'off'
      if (currentDuration === 30) {
        do {
          newState = getRandomItem(MACHINE_STATES);
        } while (newState === 'off');
      } else {
        // For subsequent changes, get any state except current one
        const record = activeRecordsRef.current[recordId];
        do {
          newState = getRandomItem(MACHINE_STATES);
        } while (newState === record.currentState);
      }
      
      const isOff = newState === 'off';
      
      // Generate completely new values for each state change
      const { ct1, ct2, ct3, ctAvg, totalCurrent } = generateCTValues(!isOff);
      
      console.log(`Changing state for ${machineId} to ${newState} with CT values:`, 
                 { CT1: ct1, CT2: ct2, CT3: ct3, CT_Avg: ctAvg, total: totalCurrent });
      
      try {
        const { error } = await supabase
          .from('liveData')
          .insert({
            _id: uuidv4(),
            machineId: machineId,
            state: newState,
            created_at: new Date().toISOString(),
            state_duration: currentDuration,
            CT1: ct1,
            CT2: ct2,
            CT3: ct3,
            CT_Avg: ctAvg,
            total_current: totalCurrent,
            fault_status: getRandomItem(FAULT_STATUSES),
            fw_version: getRandomFloat(1.0, 5.0, 1),
            mac: `00:1A:2B:${machineId.slice(-2)}:FF:EE`,
            hi: Math.floor(Math.random() * 100).toString()
          });

        if (error) throw error;

        // Update the record's current state in our ref
        if (activeRecordsRef.current[recordId]) {
          activeRecordsRef.current[recordId].currentState = newState;
        }
        
        console.log(`State changed for ${machineId} at ${currentDuration}s to ${newState}`);
      } catch (error) {
        console.error('Error updating machine state:', error);
      }
    }
  };

  const generateStateChange = async () => {
    const currentTimestamp = new Date();
    const machineId = getRandomItem(MACHINE_IDS);
    const recordId = uuidv4();
    
    try {
      // Create initial record with 'off' state and zero CT values
      const { error } = await supabase
        .from('liveData')
        .insert({
          _id: recordId,
          machineId: machineId,
          state: 'off',
          created_at: currentTimestamp.toISOString(),
          state_duration: 0,
          CT1: 0,
          CT2: 0,
          CT3: 0,
          CT_Avg: 0,
          total_current: 0,
          fault_status: 'normal',
          fw_version: getRandomFloat(1.0, 5.0, 1),
          mac: `00:1A:2B:${machineId.slice(-2)}:FF:EE`,
          hi: Math.floor(Math.random() * 100).toString()
        });

      if (error) throw error;

      // Store the record info in our ref
      activeRecordsRef.current[recordId] = {
        recordId,
        startTime: currentTimestamp,
        machineId,
        currentState: 'off',
        stateDuration: 0
      };

      console.log(`Created new record for ${machineId} with ID ${recordId} in 'off' state with zero CT values`);
    } catch (error) {
      console.error('Failed to create initial record:', error);
    }
  };

  const updateStateDurations = async () => {
    const now = new Date();
    
    // Update each active record
    for (const recordId of Object.keys(activeRecordsRef.current)) {
      const record = activeRecordsRef.current[recordId];
      const elapsedSeconds = Math.floor((now.getTime() - record.startTime.getTime()) / 1000);
      
      // Update the duration in our ref
      record.stateDuration = elapsedSeconds;
      
      // Check if we need to change state based on duration
      await updateRecordState(recordId, record.machineId, elapsedSeconds);
    }
  };

  const toggleDataGeneration = () => {
    if (isGenerating) {
      // Clear all intervals and refs
      if (intervalId !== null) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
      activeRecordsRef.current = {};
      setDemoUseCase(false);
      
      toast({
        title: "Mock Data Generation Stopped",
        description: "No longer generating mock data"
      });
    } else {
      // Start generating mock data
      generateStateChange(); // Generate first record
      
      // Set up interval for duration updates and state changes
      const id = setInterval(() => {
        updateStateDurations();
        // Generate a new record every 5 seconds
        if (Math.random() > 0.5) { // Only generate new records sometimes for variety
          generateStateChange(); 
        }
      }, 1000) as unknown as number;
      
      setIntervalId(id);
      
      toast({
        title: "Mock Data Generation Started",
        description: "Generating mock data with state changes every 30 seconds"
      });
    }
    
    setIsGenerating(!isGenerating);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
      }
      activeRecordsRef.current = {};
      setDemoUseCase(false);
    };
  }, [intervalId]);

  return {
    isGenerating,
    toggleDataGeneration,
    demoUseCase
  };
};
