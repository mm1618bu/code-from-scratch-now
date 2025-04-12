
import React from 'react';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MachineSelectorProps {
  machines: string[];
  selectedMachine: string;
  setSelectedMachine: (value: string) => void;
}

const MachineSelector: React.FC<MachineSelectorProps> = ({ 
  machines, 
  selectedMachine, 
  setSelectedMachine 
}) => {
  return (
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
  );
};

export default MachineSelector;
