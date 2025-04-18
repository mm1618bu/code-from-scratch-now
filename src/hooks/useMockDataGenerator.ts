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
  const debugTimerRef = useRef<number | null>(null);

  const startDemoUseCase = () => {
    forceOfflineMachine('MACH001');
    startTimeRef.current = new Date();
    setDemoUseCase(true);
    
    toast({
      title: "Demo Use Case Started",
      description: "MACH001 will be offline for 3 minutes with zero current values",
    });
    
    setTimeout(() => {
      clearForceOfflineMachine('MACH001');
      setDemoUseCase(false);
      toast({
        title: "Demo Use Case Completed",
        description: "MACH001's forced offline period has ended",
      });
    }, 3 * 60 * 1000);
  };

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
      
      console.log(`Machine ${machineId} status check:`, {
        previousState,
        hasStartTime: !!machineStartTime,
        startTime: machineStartTime,
        thirtySecondsPassed,
        currentTime: currentTimestamp,
        timeSinceStart: machineStartTime ? currentTimestamp.getTime() - machineStartTime.getTime() : 'N/A'
      });
      
      let stateDuration = 0;
      if (currentData?.created_at) {
        const createdAtTime = new Date(currentData.created_at).getTime();
        const timeSinceCreation = currentTimestamp.getTime() - createdAtTime;
        
        if (thirtySecondsPassed) {
          stateDuration = Math.floor((timeSinceCreation - 30000) / 1000);
          if (stateDuration < 0) stateDuration = 0;
        }
      }
      
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
        console.log(`Setting start time for ${machineId}:`, machineStartTimeRef.current[machineId]);
      } else if (thirtySecondsPassed) {
        do {
          newState = getRandomItem(MACHINE_STATES);
        } while (newState === previousState);
      } else {
        newState = previousState;
      }
      
      let ct1: number, ct2: number, ct3: number, ctAvg: number, totalCurrent: number;
      
      if (isForced || newState === 'off') {
        ct1 = 0.0;
        ct2 = 0.0;
        ct3 = 0.0;
        ctAvg = 0.0;
        totalCurrent = 0.0;
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

  const toggleDataGeneration = () => {
    if (isGenerating) {
      if (intervalId !== null) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
      if (zeroValuesTimeoutRef.current !== null) {
        clearTimeout(zeroValuesTimeoutRef.current);
        zeroValuesTimeoutRef.current = null;
      }
      if (debugTimerRef.current !== null) {
        clearInterval(debugTimerRef.current);
        debugTimerRef.current = null;
      }
      
      setDemoUseCase(false);
      startTimeRef.current = null;
      machineStartTimeRef.current = {};
      
      toast({
        title: "Mock Data Generation Stopped",
        description: "No longer generating mock data"
      });
    } else {
      startTimeRef.current = new Date();
      machineStartTimeRef.current = {};
      
      debugTimerRef.current = window.setInterval(() => {
        console.log('Current machine start times:', { ...machineStartTimeRef.current });
      }, 10000) as unknown as number;
      
      const id = setInterval(generateStateChange, 5000) as unknown as number;
      setIntervalId(id);
      
      toast({
        title: "Mock Data Generation Started",
        description: "Generating mock data with zero values for first 30 seconds"
      });
      
      generateStateChange();
      
      zeroValuesTimeoutRef.current = window.setTimeout(() => {
        toast({
          title: "Switching to Non-Zero Values",
          description: "Now generating random non-zero current values"
        });
      }, 30000) as unknown as number;
      
      startDemoUseCase();
    }
    
    setIsGenerating(!isGenerating);
  };

  useEffect(() => {
    return () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
      }
      if (zeroValuesTimeoutRef.current !== null) {
        clearTimeout(zeroValuesTimeoutRef.current);
      }
      if (debugTimerRef.current !== null) {
        clearInterval(debugTimerRef.current);
      }
      setDemoUseCase(false);
      startTimeRef.current = null;
      machineStartTimeRef.current = {};
    };
  }, [intervalId]);

  return {
    isGenerating,
    toggleDataGeneration,
    demoUseCase
  };
};
