
import React from 'react';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TargetStateSelectorProps {
  states: string[];
  targetState: string;
  setTargetState: (value: string) => void;
  currentState: string;
}

const TargetStateSelector: React.FC<TargetStateSelectorProps> = ({ 
  states,
  targetState,
  setTargetState,
  currentState
}) => {
  return (
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
  );
};

export default TargetStateSelector;
