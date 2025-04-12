
import React from 'react';
import SageLogo from '@/components/SageLogo';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft } from 'lucide-react';
import { useLiveData } from '@/hooks/useLiveData';
import LiveDataHeader from '@/components/LiveData/LiveDataHeader';
import LiveDataContent from '@/components/LiveData/LiveDataContent';
import LiveDataFooter from '@/components/LiveData/LiveDataFooter';

const LiveData: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    // Data fetching
    liveData,
    loading,
    fetchLiveData,
    
    // Alerts
    alertCount,
    showAlerts,
    setShowAlerts,
    currentAlerts,
    clearAlerts
  } = useLiveData();

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

      <div className="flex-grow w-full max-w-5xl p-6">
        <LiveDataHeader 
          loading={loading}
          fetchLiveData={fetchLiveData}
          alertCount={alertCount}
          showAlerts={showAlerts}
          setShowAlerts={setShowAlerts}
          currentAlerts={currentAlerts}
          clearAlerts={clearAlerts}
        />
        
        <LiveDataContent 
          liveData={liveData}
          loading={loading}
        />

        {user && <LiveDataFooter user={user} />}
      </div>

      <footer className="w-full p-6 mt-auto text-center">
        <p className="text-gray-400 text-sm">
          Need help? <a href="#" className="text-sage hover:underline">Contact Support</a>
        </p>
      </footer>
    </div>
  );
};

export default LiveData;
