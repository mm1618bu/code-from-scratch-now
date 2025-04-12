
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

  // Add multiple machines at once
  const addMultipleMachines = async (count: number) => {
    try {
      console.log(`Generating ${count} new machines...`);
      
      // Create an array to hold all machine data objects
      const machineDataArray = [];
      
      // Generate the specified number of machines
      for (let i = 0; i < count; i++) {
        const newMachineData = await generateNewMachineData();
        machineDataArray.push(newMachineData);
      }
      
      // Insert all machines at once
      console.log(`Adding ${count} new machines to database`);
      const { error } = await supabase
        .from('liveData')
        .insert(machineDataArray);
      
      if (error) {
        console.error('Error inserting multiple machines:', error);
        throw error;
      }
      
      toast({
        title: "Multiple Machines Added",
        description: `Generated ${count} new machines added to the system`,
      });
      
      return machineDataArray;
    } catch (error) {
      console.error('Failed to add multiple machines:', error);
      toast({
        title: "Error Adding Machines",
        description: "Failed to add multiple machines to the database",
        variant: "destructive"
      });
      return [];
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
      // Start generation - every 20 seconds (20000 ms) generating 30 machines
      const id = setInterval(() => addMultipleMachines(30), 20000) as unknown as number;
      intervalRef.current = id;
      toast({
        title: "Machine Generation Started",
        description: "Generating 30 new machines every 20 seconds"
      });
      // Generate machines immediately
      addMultipleMachines(30);
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
    addNewMachine,
    addMultipleMachines
  };
};
