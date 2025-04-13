
import React from 'react';
import { Database, RefreshCw, Table, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import AlertMenu from '@/components/LiveData/AlertMenu';

interface LiveDataHeaderProps {
  loading: boolean;
  fetchLiveData: () => void;
  alertCount: number;
  showAlerts: boolean;
  setShowAlerts: (show: boolean) => void;
  currentAlerts: any[];
  clearAlerts: () => void;
}

const LiveDataHeader: React.FC<LiveDataHeaderProps> = ({
  loading,
  fetchLiveData,
  alertCount,
  showAlerts,
  setShowAlerts,
  currentAlerts,
  clearAlerts
}) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center">
        <Database className="h-5 w-5 mr-2 text-sage" />
        <h1 className="text-white text-2xl font-bold">Supabase Live Data</h1>
      </div>
      
      <div className="flex gap-2">
        <AlertMenu 
          alertCount={alertCount}
          showAlerts={showAlerts}
          setShowAlerts={setShowAlerts}
          currentAlerts={currentAlerts}
          clearAlerts={clearAlerts}
        />
        
        <Button 
          onClick={() => navigate('/notifications')}
          variant="outline"
          className="border-sage text-sage hover:bg-sage/20"
        >
          <Bell className="h-4 w-4 mr-2" />
          Notifications
        </Button>
        
        <Button 
          onClick={() => navigate('/all-live-data')}
          variant="outline"
          className="border-sage text-sage hover:bg-sage/20"
        >
          <Table className="h-4 w-4 mr-2" />
          View All Live Data
        </Button>
        
        <Button 
          onClick={fetchLiveData} 
          variant="outline" 
          size="sm"
          disabled={loading}
          className="border-sage text-sage hover:bg-sage/20"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default LiveDataHeader;
