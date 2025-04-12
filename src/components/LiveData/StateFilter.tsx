
import React from 'react';
import { Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StateFilterProps {
  stateFilter: string;
  setStateFilter: (state: string) => void;
  uniqueStates: string[];
}

const StateFilter: React.FC<StateFilterProps> = ({
  stateFilter,
  setStateFilter,
  uniqueStates
}) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-400 text-sm">Filter by State:</span>
      <Select
        value={stateFilter}
        onValueChange={setStateFilter}
      >
        <SelectTrigger className="w-[180px] bg-dark-foreground/20 border-dark-foreground/30 text-white">
          <SelectValue placeholder="Select a state" />
        </SelectTrigger>
        <SelectContent className="bg-dark border-dark-foreground/30">
          <SelectGroup>
            <SelectLabel className="text-gray-400">Machine States</SelectLabel>
            {uniqueStates.map((state) => (
              <SelectItem key={state} value={state} className="text-white capitalize hover:bg-dark-foreground/20">
                {state === "all" ? "All States" : state}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Filter className="h-4 w-4 text-sage" />
    </div>
  );
};

export default StateFilter;
