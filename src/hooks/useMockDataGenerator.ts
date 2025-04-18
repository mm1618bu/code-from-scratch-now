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

  const generateCTValues = (isActive: boolean) => {
    if (!isActive) {
      return {
        ct1: 0,
        ct2: 0,
        ct3: 0,
        ctAvg: 0,
        totalCurrent: 0
      };
    } else {
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
    if (!activeRecordsRef.current[recordId]) {
      console.error(`Record ${recordId} not found in activeRecordsRef`);
      return;
    }

    if (currentDuration > 0 && currentDuration % 30 === 0) {
      console.log(`Time to change state for ${machineId} at ${currentDuration}s`);
      
      const record = activeRecordsRef.current[recordId];
      if (!record) {
        console.error(`Record ${recordId} not found when trying to change state`);
        return;
      }
      
      let newState;
      if (currentDuration === 30) {
        do {
          newState = getRandomItem(MACHINE_STATES);
        } while (newState === 'off');
      } else {
        do {
          newState = getRandomItem(MACHINE_STATES);
        } while (newState === record.currentState);
      }
      
      const isActive = newState !== 'off';
      const ctValues = generateCTValues(isActive);
      
      console.log(`Updating state for ${machineId} from ${record.currentState} to ${newState} with CT values:`, 
                 { CT1: ctValues.ct1, CT2: ctValues.ct2, CT3: ctValues.ct3, CT_Avg: ctValues.ctAvg, total: ctValues.totalCurrent });
      
      try {
        const { error } = await supabase
          .from('liveData')
          .update({
            state: newState,
            CT1: ctValues.ct1,
            CT2: ctValues.ct2,
            CT3: ctValues.ct3,
            CT_Avg: ctValues.ctAvg,
            total_current: ctValues.totalCurrent,
            state_duration: currentDuration,
            fault_status: getRandomItem(FAULT_STATUSES)
          })
          .eq('_id', recordId);

        if (error) {
          console.error('Error updating state record:', error);
          throw error;
        }

        activeRecordsRef.current[recordId].currentState = newState;
        
        console.log(`Successfully updated state for ${machineId} to ${newState}`);
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

      if (error) {
        console.error('Error creating initial record:', error);
        throw error;
      }

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
    const recordsToUpdate = { ...activeRecordsRef.current };
    
    for (const recordId of Object.keys(recordsToUpdate)) {
      const record = recordsToUpdate[recordId];
      if (!record || !record.startTime) {
        console.error(`Invalid record or startTime for ${recordId}`);
        delete activeRecordsRef.current[recordId];
        continue;
      }
      
      const elapsedSeconds = Math.floor((now.getTime() - record.startTime.getTime()) / 1000);
      
      if (activeRecordsRef.current[recordId]) {
        activeRecordsRef.current[recordId].stateDuration = elapsedSeconds;
      }
      
      await updateRecordState(recordId, record.machineId, elapsedSeconds);
    }
  };

  const toggleDataGeneration = () => {
    if (isGenerating) {
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
      generateStateChange();
      
      const id = setInterval(() => {
        updateStateDurations();
        
        if (Math.random() > 0.5) {
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
