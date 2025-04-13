
import { useMachineGenerator } from '@/hooks/useMachineGenerator';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MachineGenerator = () => {
  const { addNewMachine } = useMachineGenerator();

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
    </div>
  );
};

export default MachineGenerator;
