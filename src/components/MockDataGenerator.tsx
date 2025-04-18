import { useEffect, useState } from 'react';
import { useMockDataGenerator } from '@/hooks/useMockDataGenerator';

const MockDataGenerator = ({ onMachineStateChange }: { onMachineStateChange: (states: any[]) => void }) => {
  const { isGenerating, toggleDataGeneration, demoUseCase } = useMockDataGenerator();
  const [mockMachineStates, setMockMachineStates] = useState([
    { machineId: 'MACH001', state: 'off', totalCurrent: 0 },
  ]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isGenerating) {
      interval = setInterval(() => {
        setMockMachineStates((prevStates) => {
          const updatedStates = prevStates.map((machine) => {
            if (machine.machineId === 'MACH001') {
              // Simulate state change from "off" to "running"
              const newState = machine.state === 'off' ? 'running' : 'off';
              const newCurrent = newState === 'running' ? 16.0 : 0;
              return { ...machine, state: newState, totalCurrent: newCurrent };
            }
            return machine;
          });

          // Notify parent component of state changes
          onMachineStateChange(updatedStates);

          return updatedStates;
        });
      }, 3000); // Change state every 3 seconds
    } else {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [isGenerating, onMachineStateChange]);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {isGenerating && demoUseCase && (
        <div className="bg-sage/10 p-3 rounded-lg text-white text-xs max-w-xs">
          <p className="font-semibold">Demo Use Case Active:</p>
          <p>
            MACH001 will toggle between "off" and "running" every 3 seconds. When it turns on, an alert will notify you.
          </p>
        </div>
      )}
      <button
        onClick={toggleDataGeneration}
        className={`px-4 py-2 rounded-full text-white shadow-lg flex items-center ${
          isGenerating ? 'bg-red-500 hover:bg-red-600' : 'bg-sage hover:bg-sage/90'
        }`}
      >
        <span className={`w-3 h-3 rounded-full mr-2 ${isGenerating ? 'bg-white animate-pulse' : 'bg-white'}`}></span>
        {isGenerating ? 'Stop Mock Data' : 'Start Mock Data'}
      </button>
    </div>
  );
};

export default MockDataGenerator;
