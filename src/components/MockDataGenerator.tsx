
import { useEffect } from 'react';
import { useMockDataGenerator } from '@/hooks/useMockDataGenerator';

const MockDataGenerator = () => {
  const { isGenerating, toggleDataGeneration } = useMockDataGenerator();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {isGenerating && (
        <div className="bg-sage/10 p-2 rounded-lg text-white text-xs max-w-xs">
          <p className="font-semibold">Demo Use Case Active:</p>
          <p>MACH001 will be offline for 3 minutes with zero current values. When it returns online, an alert will notify you.</p>
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
