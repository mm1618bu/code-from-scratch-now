
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { generateNewMachineData } from '@/utils/machineGeneratorUtils';

export const useMachineGenerator = () => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const intervalRef = useRef<number | null>(null);
  
  // Generate and add a new machine to the database
  const addNewMachine = async () => {
    try {
      console.log('Generating new machine data...');
      const newMachineData = await generateNewMachineData();
      
      console.log('Adding new machine to database:', newMachineData.machineId);
      const { error } = await supabase
        .from('liveData')
        .insert(newMachineData);
      
      if (error) {
        console.error('Error inserting new machine:', error);
        throw error;
      }
      
      toast({
        title: "New Machine Added",
        description: `Generated machine ${newMachineData.machineId} added to the system`,
      });
      
      return newMachineData;
    } catch (error) {
      console.error('Failed to add new machine:', error);
      toast({
        title: "Error Adding Machine",
        description: "Failed to add new machine to the database",
        variant: "destructive"
      });
      return null;
    }
  };

  // Toggle machine generation on/off
  const toggleMachineGeneration = () => {
    if (isGenerating) {
      // Stop generation
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      toast({
        title: "Machine Generation Stopped",
        description: "No longer generating new machines"
      });
    } else {
      // Start generation - every 15 minutes (900000 ms)
      const id = setInterval(addNewMachine, 900000) as unknown as number;
      intervalRef.current = id;
      toast({
        title: "Machine Generation Started",
        description: "Generating a new machine every 15 minutes"
      });
      // Generate one immediately
      addNewMachine();
    }
    
    setIsGenerating(!isGenerating);
  };

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isGenerating,
    toggleMachineGeneration,
    addNewMachine
  };
};
