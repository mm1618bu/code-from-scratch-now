
import React from 'react';
import { RefreshCw, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import AlertMenu, { AlertItem } from './AlertMenu';

interface HeaderActionsProps {
  loading: boolean;
  handleRefreshData: () => void;
  alertCount: number;
  showAlerts: boolean;
  setShowAlerts: (show: boolean) => void;
  currentAlerts: AlertItem[];
  clearAlerts: () => void;
}

const HeaderActions: React.FC<HeaderActionsProps> = ({
  loading,
  handleRefreshData,
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
        <Database className="h-6 w-6 mr-2 text-sage" />
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
          onClick={handleRefreshData} 
          variant="outline" 
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

export default HeaderActions;
