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
  const zeroValuesTimeoutRef = useRef<number | null>(null);
  const machineStartTimeRef = useRef<Record<string, Date>>({});

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
    const currentTimestamp = new Date();
    let machineId = getRandomItem(MACHINE_IDS);
    let isForced = false;
    
    if (isForceOfflineMachine('MACH001')) {
      machineId = 'MACH001';
      isForced = true;
    }
    
    try {
      const { data: currentData } = await supabase
        .from('liveData')
        .select('state, created_at')
        .eq('machineId', machineId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      const previousState = currentData?.state || 'off';
      const machineStartTime = machineStartTimeRef.current[machineId];
      const thirtySecondsPassed = machineStartTime && 
        (currentTimestamp.getTime() - machineStartTime.getTime() >= 30000);
      
      // Calculate state duration in seconds
      let stateDuration = 0;
      if (currentData?.created_at) {
        const createdAtTime = new Date(currentData.created_at).getTime();
        const timeSinceCreation = currentTimestamp.getTime() - createdAtTime;
        
        if (thirtySecondsPassed) {
          // If 30 seconds have passed, calculate duration from that point
          stateDuration = Math.floor((timeSinceCreation - 30000) / 1000);
          if (stateDuration < 0) stateDuration = 0;
        }
      }
      
      // Determine new state based on conditions
      let newState;
      
      if (isForced) {
        newState = 'off';
      } else if (thirtySecondsPassed && previousState === 'off') {
        do {
          newState = getRandomItem(MACHINE_STATES);
        } while (newState === 'off');
        
        delete machineStartTimeRef.current[machineId];
        
        toast({
          title: "Machine State Changed",
          description: `${machineId} is now ${newState} after initial 30 seconds offline period`,
        });
      } else if (!machineStartTime && (previousState === 'off' || !previousState)) {
        newState = 'off';
        machineStartTimeRef.current[machineId] = new Date();
      } else if (thirtySecondsPassed) {
        do {
          newState = getRandomItem(MACHINE_STATES);
        } while (newState === previousState);
      } else {
        newState = previousState;
      }
      
      // Generate current values based on state and time conditions
      let ct1, ct2, ct3, ctAvg, totalCurrent;
      
      if (isForced || (machineStartTime && !thirtySecondsPassed)) {
        ct1 = 0;
        ct2 = 0;
        ct3 = 0;
        ctAvg = 0;
        totalCurrent = 0;
      } else {
        ct1 = Math.max(1.0, getRandomFloat(1.0, 6.0));
        ct2 = Math.max(1.0, getRandomFloat(1.0, 6.0));
        ct3 = Math.max(1.0, getRandomFloat(1.0, 6.0));
        ctAvg = Math.max(1.0, getRandomFloat(1.0, 15.0));
        totalCurrent = Math.max(1.0, generatePossiblyHighTotalCurrent());
      }
      
      const faultStatus = newState === 'off' ? 'normal' : getRandomItem(FAULT_STATUSES);
      
      const insertTimestamp = new Date();
      
      const { error: insertError } = await supabase
        .from('liveData')
        .insert({
          machineId: machineId,
          state: newState,
          created_at: insertTimestamp.toISOString(),
          state_duration: stateDuration,
          total_current: totalCurrent,
          CT_Avg: ctAvg,
          CT1: ct1,
          CT2: ct2,
          CT3: ct3,
          fw_version: getRandomFloat(1.0, 5.0, 1),
          fault_status: faultStatus,
          mac: `00:1A:2B:${machineId.slice(-2)}:FF:EE`,
          hi: Math.floor(Math.random() * 100).toString(),
          _id: uuidv4()
        });
      
      if (insertError) {
        console.error('Error inserting new record:', insertError);
        throw insertError;
      }
      
      console.log(`Created new record for machine ${machineId}: state changed to ${newState} at ${insertTimestamp.toISOString()}`);
      
      notifyMachineStateChange({
        machineId,
        previousState,
        newState,
        timestamp: insertTimestamp.toISOString(),
        totalCurrent
      });
      
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
      if (zeroValuesTimeoutRef.current !== null) {
        clearTimeout(zeroValuesTimeoutRef.current);
        zeroValuesTimeoutRef.current = null;
      }
      setDemoUseCase(false);
      startTimeRef.current = null;
      toast({
        title: "Mock Data Generation Stopped",
        description: "No longer generating mock data"
      });
    } else {
      // Set the start time for zero values period
      startTimeRef.current = new Date();
      
      // Start generation - exactly one record every 5 seconds
      const id = setInterval(generateStateChange, 5000) as unknown as number;
      setIntervalId(id);
      
      toast({
        title: "Mock Data Generation Started",
        description: "Generating mock data with zero values for first 30 seconds"
      });
      
      // Generate one immediately
      generateStateChange();
      
      // After 30 seconds, show toast about switching to non-zero values
      zeroValuesTimeoutRef.current = window.setTimeout(() => {
        toast({
          title: "Switching to Non-Zero Values",
          description: "Now generating random non-zero current values"
        });
      }, 30000) as unknown as number;
      
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
      if (zeroValuesTimeoutRef.current !== null) {
        clearTimeout(zeroValuesTimeoutRef.current);
      }
      setDemoUseCase(false);
      startTimeRef.current = null;
    };
  }, [intervalId]);

  return {
    isGenerating,
    toggleDataGeneration,
    demoUseCase
  };
};
