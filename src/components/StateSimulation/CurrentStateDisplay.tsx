
import React from 'react';
import { Label } from '@/components/ui/label';

interface CurrentStateDisplayProps {
  currentState: string;
}

const CurrentStateDisplay: React.FC<CurrentStateDisplayProps> = ({ currentState }) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="current-state" className="text-white">Current State</Label>
      <div className="p-2 border border-dark-foreground/30 rounded-md bg-dark-foreground/20 text-white">
        {currentState || 'Unknown'}
      </div>
    </div>
  );
};

export default CurrentStateDisplay;
