
import React from 'react';
import SageLogo from '@/components/SageLogo';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Database } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLiveData } from '@/hooks/useLiveData';
import { getStateColor } from '@/utils/stateColors';
import HeaderActions from '@/components/LiveData/HeaderActions';
import StateFilter from '@/components/LiveData/StateFilter';
import LiveDataTable from '@/components/LiveData/LiveDataTable';
import DataPagination from '@/components/LiveData/DataPagination';

const AllLiveData: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const {
    loading,
    stateFilter,
    setStateFilter,
    currentPage,
    setCurrentPage,
    alertCount,
    showAlerts,
    setShowAlerts,
    currentAlerts,
    clearAlerts,
    fetchLiveData,
    uniqueStates,
    totalPages,
    currentData,
    filteredData,
    liveData
  } = useLiveData();

  const handleRefreshData = () => {
    fetchLiveData();
  };

  return (
    <div className="min-h-screen bg-dark flex flex-col items-center">
      <header className="w-full p-4 flex justify-between items-center">
        <SageLogo />
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            className="text-white hover:bg-dark-foreground/20"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <div className="flex-grow w-full max-w-7xl p-6">
        <HeaderActions 
          loading={loading}
          handleRefreshData={handleRefreshData}
          alertCount={alertCount}
          showAlerts={showAlerts}
          setShowAlerts={setShowAlerts}
          currentAlerts={currentAlerts}
          clearAlerts={clearAlerts}
        />
        
        <div className="bg-dark-foreground/10 p-6 rounded-lg">
          <div className="p-4 bg-amber-500/20 border border-amber-500/50 rounded-lg mb-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-300 text-sm">
                  Live Data from Supabase
                </p>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-sage font-semibold">
                  {liveData.length} Total Records
                </span>
                <span className="text-xs text-gray-400">
                  {filteredData.length} Records Filtered
                </span>
                <span className="text-xs text-gray-400">
                  Displaying {currentData.length} Records on Page {currentPage}
                </span>
              </div>
            </div>
          </div>

          <div className="mb-4 flex justify-end">
            <StateFilter 
              stateFilter={stateFilter}
              setStateFilter={setStateFilter}
              uniqueStates={uniqueStates}
            />
          </div>

          <ScrollArea className="h-[500px] rounded-md border border-dark-foreground/20">
            <LiveDataTable 
              loading={loading}
              currentData={currentData}
              stateFilter={stateFilter}
              getStateColor={getStateColor}
            />
          </ScrollArea>
          
          <DataPagination 
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
          />
        </div>

        {user && (
          <div className="p-4 bg-dark-foreground/10 rounded-lg mt-6">
            <p className="text-gray-400">Current user: {user.email}</p>
          </div>
        )}
      </div>

      <footer className="w-full p-6 mt-auto text-center">
        <p className="text-gray-400 text-sm">
          Need help? <a href="#" className="text-sage hover:underline">Contact Support</a>
        </p>
      </footer>
    </div>
  );
};

export default AllLiveData;
