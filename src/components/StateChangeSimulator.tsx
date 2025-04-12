
import React from 'react';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useStateChangeSimulator } from '@/hooks/useStateChangeSimulator';
import MachineSelector from '@/components/StateSimulation/MachineSelector';
import CurrentStateDisplay from '@/components/StateSimulation/CurrentStateDisplay';
import TargetStateSelector from '@/components/StateSimulation/TargetStateSelector';

const StateChangeSimulator: React.FC = () => {
  const {
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
  } = useStateChangeSimulator();

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
            <MachineSelector 
              machines={machines} 
              selectedMachine={selectedMachine} 
              setSelectedMachine={setSelectedMachine}
            />
            
            <CurrentStateDisplay currentState={currentState} />
            
            <TargetStateSelector 
              states={states} 
              targetState={targetState} 
              setTargetState={setTargetState} 
              currentState={currentState}
            />
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
