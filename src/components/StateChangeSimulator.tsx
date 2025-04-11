
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { notifyMachineStateChange } from '@/lib/notification';
import { Play } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

// Default state options if no data is loaded from the database
const defaultStates = ['running', 'idle', 'error', 'maintenance', 'standby'];

const StateChangeSimulator: React.FC = () => {
  const [machines, setMachines] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>(defaultStates);
  const [selectedMachine, setSelectedMachine] = useState('');
  const [currentState, setCurrentState] = useState('');
  const [targetState, setTargetState] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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

        console.log('Fetched data:', data);

        if (data && data.length > 0) {
          // Extract unique machine IDs
          const uniqueMachines = [...new Set(data.map(item => item.machineId))].filter(Boolean) as string[];
          
          // Extract unique states
          const uniqueStates = [...new Set(data.map(item => item.state))].filter(Boolean) as string[];
          
          console.log('Unique machines:', uniqueMachines);
          console.log('Unique states:', uniqueStates);
          
          setMachines(uniqueMachines.length > 0 ? uniqueMachines : ['MACH001']);
          setStates(uniqueStates.length > 0 ? uniqueStates : defaultStates);
          
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
              } else if (defaultStates.length > 0) {
                setTargetState(defaultStates[0] !== machineData.state ? defaultStates[0] : defaultStates[1]);
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
          .select('state')
          .eq('machineId', selectedMachine)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('Error fetching machine state:', error);
          return;
        }

        console.log('Current state data:', data);

        if (data && data.length > 0 && data[0].state) {
          setCurrentState(data[0].state);
          
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
      console.log('Simulating state change:', {
        machineId: selectedMachine,
        previousState: currentState,
        newState: targetState
      });
      
      // Notify about state change
      await notifyMachineStateChange({
        machineId: selectedMachine,
        previousState: currentState,
        newState: targetState,
        timestamp: new Date().toISOString()
      });
      
      // Insert the new state into the database
      const { error } = await supabase
        .from('liveData')
        .insert({
          machineId: selectedMachine,
          state: targetState,
          created_at: new Date().toISOString(),
          _id: uuidv4() // Generate a unique ID for each record
        });
        
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

  return (
    <Card className="w-full max-w-md bg-dark-foreground/10 border-dark-foreground/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Play className="mr-2 h-5 w-5 text-sage" />
          State Change Simulator
        </CardTitle>
        <CardDescription className="text-gray-400">
          Simulate machine state changes to test notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin h-6 w-6 border-t-2 border-sage rounded-full" />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="machine-select" className="text-white">Machine</Label>
              <Select
                value={selectedMachine}
                onValueChange={setSelectedMachine}
              >
                <SelectTrigger id="machine-select" className="bg-dark-foreground/20 border-dark-foreground/30 text-white">
                  <SelectValue placeholder="Select a machine" />
                </SelectTrigger>
                <SelectContent className="bg-dark border-dark-foreground/30">
                  {machines.map(machine => (
                    <SelectItem key={machine} value={machine} className="text-white hover:bg-dark-foreground/20">
                      {machine}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="current-state" className="text-white">Current State</Label>
              <div className="p-2 border border-dark-foreground/30 rounded-md bg-dark-foreground/20 text-white">
                {currentState || 'Unknown'}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="target-state-select" className="text-white">Target State</Label>
              <Select
                value={targetState}
                onValueChange={setTargetState}
              >
                <SelectTrigger id="target-state-select" className="bg-dark-foreground/20 border-dark-foreground/30 text-white">
                  <SelectValue placeholder="Select target state" />
                </SelectTrigger>
                <SelectContent className="bg-dark border-dark-foreground/30">
                  {states.map(state => (
                    <SelectItem 
                      key={state} 
                      value={state} 
                      className="text-white hover:bg-dark-foreground/20"
                      disabled={state === currentState}
                    >
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSimulateStateChange} 
          disabled={isSimulating || targetState === currentState || isLoading || !selectedMachine}
          className="w-full bg-sage hover:bg-sage/90 text-white"
        >
          {isSimulating ? 'Simulating...' : 'Simulate State Change'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default StateChangeSimulator;
