
import React, { useState } from 'react';
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

const machines = ['MACH001', 'MACH002', 'MACH003', 'MACH004', 'MACH005'];
const states = ['running', 'idle', 'error', 'maintenance', 'standby'];

const StateChangeSimulator: React.FC = () => {
  const [selectedMachine, setSelectedMachine] = useState('MACH001');
  const [currentState, setCurrentState] = useState('running');
  const [targetState, setTargetState] = useState('idle');
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulateStateChange = async () => {
    setIsSimulating(true);
    
    try {
      await notifyMachineStateChange({
        machineId: selectedMachine,
        previousState: currentState,
        newState: targetState,
        timestamp: new Date().toISOString()
      });
      
      // Update current state after simulation
      setCurrentState(targetState);
    } catch (error) {
      console.error('Error simulating state change:', error);
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
            {currentState}
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
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSimulateStateChange} 
          disabled={isSimulating || targetState === currentState}
          className="w-full bg-sage hover:bg-sage/90 text-white"
        >
          {isSimulating ? 'Simulating...' : 'Simulate State Change'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default StateChangeSimulator;
