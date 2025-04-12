
import { useMachineGenerator } from '@/hooks/useMachineGenerator';
import { PlusCircle, Server, ToggleLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MachineGenerator = () => {
  const { isGenerating, toggleMachineGeneration, addNewMachine, addMultipleMachines } = useMachineGenerator();

  const handleAddMultipleMachines = () => {
    addMultipleMachines(30);
  };

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={addNewMachine}
        className="bg-dark-foreground/30 text-white hover:bg-dark-foreground/50 shadow-md"
      >
        <PlusCircle className="h-4 w-4 mr-2" />
        Add Single Machine
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleAddMultipleMachines}
        className="bg-dark-foreground/30 text-white hover:bg-dark-foreground/50 shadow-md"
      >
        <Server className="h-4 w-4 mr-2" />
        Add 30 Machines Now
      </Button>
      <Button
        onClick={toggleMachineGeneration}
        className={`px-4 py-2 rounded-full text-white shadow-lg flex items-center ${
          isGenerating ? 'bg-purple-600 hover:bg-purple-700' : 'bg-sage hover:bg-sage/90'
        }`}
      >
        <span className={`w-3 h-3 rounded-full mr-2 ${isGenerating ? 'bg-white animate-pulse' : 'bg-white'}`}></span>
        {isGenerating ? 'Stop Auto-Generation' : 'Generate 30 Machines Every 20s'}
      </Button>
    </div>
  );
};

export default MachineGenerator;
