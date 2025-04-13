
import React from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { CircuitBoard } from 'lucide-react';

interface MachineIdFilterProps {
  machineIdFilter: string;
  setMachineIdFilter: (state: string) => void;
  uniqueMachineIds: string[];
}

const MachineIdFilter: React.FC<MachineIdFilterProps> = ({
  machineIdFilter,
  setMachineIdFilter,
  uniqueMachineIds
}) => {
  return (
    <div className="flex items-center space-x-2">
      <CircuitBoard className="h-4 w-4 text-gray-400" />
      <Select
        value={machineIdFilter}
        onValueChange={setMachineIdFilter}
      >
        <SelectTrigger className="w-[180px] bg-dark-foreground/30 border-dark-foreground/30 text-white">
          <SelectValue placeholder="Filter by Machine ID" />
        </SelectTrigger>
        <SelectContent className="bg-dark border-dark-foreground/30 text-white">
          {uniqueMachineIds.map((id) => (
            <SelectItem key={id} value={id} className="text-white hover:bg-dark-foreground/20">
              {id === "all" ? "All Machines" : id}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default MachineIdFilter;
