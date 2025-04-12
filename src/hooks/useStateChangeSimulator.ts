
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { notifyMachineStateChange } from '@/lib/notification';

export const useStateChangeSimulator = () => {
  const [machines, setMachines] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>(['running', 'idle', 'error', 'maintenance', 'standby']);
  const [selectedMachine, setSelectedMachine] = useState('');
  const [currentState, setCurrentState] = useState('');
  const [targetState, setTargetState] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch machines and their states from Supabase
  useEffect(() => {
    const fetchMachines = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching machines from Supabase...');
        
        const { data, error } = await supabase
          .from('liveData')
          .select('machineId, state')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching machines:', error);
          toast({
            title: "Error fetching machines",
            description: error.message,
            variant: "destructive"
          });
          return;
        }

        if (data && data.length > 0) {
          // Extract unique machine IDs
          const uniqueMachines = [...new Set(data.map(item => item.machineId))].filter(Boolean) as string[];
          
          // Extract unique states
          const uniqueStates = [...new Set(data.map(item => item.state))].filter(Boolean) as string[];
          
          setMachines(uniqueMachines.length > 0 ? uniqueMachines : ['MACH001']);
          setStates(uniqueStates.length > 0 ? uniqueStates : states);
          
          // Set default values
          if (uniqueMachines.length > 0) {
            setSelectedMachine(uniqueMachines[0]);
            
            // Find current state for the selected machine
            const machineData = data.find(item => item.machineId === uniqueMachines[0]);
            if (machineData && machineData.state) {
              setCurrentState(machineData.state);
              
              // Set a different target state
              const otherStates = uniqueStates.filter(state => state !== machineData.state);
              if (otherStates.length > 0) {
                setTargetState(otherStates[0]);
              } else if (states.length > 0) {
                setTargetState(states[0] !== machineData.state ? states[0] : states[1]);
              }
            }
          }
        } else {
          toast({
            title: "No machines found",
            description: "No machine data in the database. Try generating mock data.",
            variant: "default"
          });
        }
      } catch (error) {
        console.error('Error in fetching machine data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMachines();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('public:liveData')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'liveData' 
      }, (payload) => {
        console.log('Real-time update received:', payload);
        // Refresh data when changes occur
        fetchMachines();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Update current state when selected machine changes
  useEffect(() => {
    const fetchCurrentState = async () => {
      if (!selectedMachine) return;
      
      try {
        console.log('Fetching current state for machine:', selectedMachine);
        
        const { data, error } = await supabase
          .from('liveData')
          .select('state, _id')
          .eq('machineId', selectedMachine)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('Error fetching machine state:', error);
          return;
        }

        if (data && data.length > 0 && data[0].state) {
          setCurrentState(data[0].state);
          setCurrentRecordId(data[0]._id);
          
          // Update target state to be different from current
          const otherStates = states.filter(state => state !== data[0].state);
          if (otherStates.length > 0) {
            setTargetState(otherStates[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching current state:', error);
      }
    };

    fetchCurrentState();
  }, [selectedMachine, states]);

  const handleSimulateStateChange = async () => {
    setIsSimulating(true);
    
    try {
      // Generate a brand new timestamp at the exact moment of simulation
      const simulationTimestamp = new Date();
      
      console.log('Simulating state change:', {
        machineId: selectedMachine,
        previousState: currentState,
        newState: targetState,
        timestamp: simulationTimestamp.toISOString()
      });
      
      // Notify about state change
      await notifyMachineStateChange({
        machineId: selectedMachine,
        previousState: currentState,
        newState: targetState,
        timestamp: simulationTimestamp.toISOString()
      });
      
      let error;
      
      if (currentRecordId) {
        // Create a fresh timestamp for this database update operation
        const updateTimestamp = new Date();
        console.log(`Updating existing record for machine ${selectedMachine} with ID ${currentRecordId} at timestamp ${updateTimestamp.toISOString()}`);
        
        const { error: updateError } = await supabase
          .from('liveData')
          .update({
            machineId: selectedMachine,
            state: targetState,
            created_at: updateTimestamp.toISOString() // Using a fresh timestamp
          })
          .eq('_id', currentRecordId);
          
        error = updateError;
      } else {
        // Create a fresh timestamp for this database insert operation
        const insertTimestamp = new Date();
        console.log(`Creating new record for machine ${selectedMachine} at timestamp ${insertTimestamp.toISOString()}`);
        
        const { error: insertError } = await supabase
          .from('liveData')
          .insert({
            machineId: selectedMachine,
            state: targetState,
            created_at: insertTimestamp.toISOString(), // Using a fresh timestamp
            _id: uuidv4() // Generate a unique ID for new records
          });
          
        error = insertError;
      }
        
      if (error) {
        console.error('Error updating state in database:', error);
        toast({
          title: "Error",
          description: "Failed to update state in database: " + error.message,
          variant: "destructive"
        });
        throw error;
      }
      
      toast({
        title: "State Changed",
        description: `Changed state of ${selectedMachine} from ${currentState} to ${targetState}`,
        variant: "default"
      });
      
      // Update current state after simulation
      setCurrentState(targetState);
      
      // Update target state to be different from new current
      const otherStates = states.filter(state => state !== targetState);
      if (otherStates.length > 0) {
        setTargetState(otherStates[0]);
      }
    } catch (error) {
      console.error('Error simulating state change:', error);
      toast({
        title: "Error",
        description: "Failed to simulate state change",
        variant: "destructive"
      });
    } finally {
      setIsSimulating(false);
    }
  };

  return {
    machines,
    states,
    selectedMachine,
    setSelectedMachine,
    currentState,
    targetState,
    setTargetState,
    isSimulating,
    isLoading,
    handleSimulateStateChange
  };
};
