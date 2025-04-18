import React from 'react';
import SageLogo from '@/components/SageLogo';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Database, RefreshCw } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLiveData } from '@/hooks/useLiveData';
import { getStateColor } from '@/utils/stateColors';
import LiveDataHeader from '@/components/LiveData/LiveDataHeader';
import StateFilter from '@/components/LiveData/StateFilter';
import MachineIdFilter from '@/components/LiveData/MachineIdFilter';
import LiveDataTable from '@/components/LiveData/LiveDataTable';
import DataPagination from '@/components/LiveData/DataPagination';
import MockDataGenerator from '@/components/MockDataGenerator';
import MachineGenerator from '@/components/MachineGenerator';
import { useToast } from '@/hooks/use-toast';

const AllLiveData: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const {
    loading,
    stateFilter,
    setStateFilter,
    machineIdFilter,
    setMachineIdFilter,
    currentPage,
    setCurrentPage,
    sortDirection,
    setSortDirection,
    alertCount,
    showAlerts,
    setShowAlerts,
    currentAlerts,
    clearAlerts,
    fetchLiveData,
    uniqueStates,
    uniqueMachineIds,
    totalPages,
    currentData,
    filteredData,
    liveData
  } = useLiveData();

  // Debug alerts when they change
  useEffect(() => {
    if (currentAlerts.length > 0) {
      console.log("Current alerts in AllLiveData:", currentAlerts);
    }
  }, [currentAlerts]);

  const handleRefreshData = () => {
    fetchLiveData();
    toast({
      title: "Data refreshed",
      description: `Found ${liveData.length} records`,
      variant: "default"
    });
  };

  const handleSortDirectionChange = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
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
        <LiveDataHeader 
          loading={loading}
          fetchLiveData={handleRefreshData}
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
                <p className="text-xs text-gray-400">
                  Manual refresh only
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

          <div className="mb-4 flex flex-wrap gap-4 justify-end">
            <StateFilter 
              stateFilter={stateFilter}
              setStateFilter={setStateFilter}
              uniqueStates={uniqueStates}
            />
            <MachineIdFilter
              machineIdFilter={machineIdFilter}
              setMachineIdFilter={setMachineIdFilter}
              uniqueMachineIds={uniqueMachineIds}
            />
          </div>

          <ScrollArea className="h-[500px] rounded-md border border-dark-foreground/20">
            <div className="overflow-auto">
              <LiveDataTable 
                loading={loading}
                currentData={currentData}
                stateFilter={stateFilter}
                machineIdFilter={machineIdFilter}
                getStateColor={getStateColor}
                sortDirection={sortDirection}
                onSortChange={handleSortDirectionChange}
              />
            </div>
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
          Need help?{" "}
          <a href="#" className="text-sage hover:underline">
            Contact Support
          </a>
        </p>
      </footer>
      
      <MockDataGenerator />
      <MachineGenerator />
    </div>
  );
};

export default AllLiveData;
