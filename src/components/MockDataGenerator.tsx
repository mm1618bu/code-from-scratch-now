
import { useEffect } from 'react';
import { useMockDataGenerator } from '@/hooks/useMockDataGenerator';

const MockDataGenerator = () => {
  const { isGenerating, toggleDataGeneration } = useMockDataGenerator();

  return (
    <div className="fixed bottom-4 right-4 z-50">
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
