
import React from 'react';
import { Bell, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export interface AlertItem {
  machineId: string;
  value: number;
  timestamp: string;
}

interface AlertMenuProps {
  alertCount: number;
  showAlerts: boolean;
  setShowAlerts: (show: boolean) => void;
  currentAlerts: AlertItem[];
  clearAlerts: () => void;
}

const AlertMenu: React.FC<AlertMenuProps> = ({
  alertCount,
  showAlerts,
  setShowAlerts,
  currentAlerts,
  clearAlerts
}) => {
  return (
    <div className="relative">
      <Button 
        onClick={() => setShowAlerts(!showAlerts)}
        variant="outline"
        className="border-sage text-sage hover:bg-sage/20 relative"
      >
        {alertCount > 0 ? (
          <>
            <BellRing className="h-4 w-4 mr-2 animate-pulse" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {alertCount}
            </span>
          </>
        ) : (
          <Bell className="h-4 w-4 mr-2" />
        )}
        Alerts
      </Button>
      
      {showAlerts && currentAlerts.length > 0 && (
        <div className="absolute right-0 mt-2 w-80 bg-dark-foreground/90 border border-sage/30 rounded-md shadow-lg z-10">
          <div className="p-3 border-b border-sage/20 flex justify-between items-center">
            <h3 className="text-white font-medium">Current Alerts</h3>
            <Button variant="ghost" size="sm" onClick={clearAlerts} className="text-gray-400 hover:text-white">
              Clear All
            </Button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {currentAlerts.map((alert, index) => (
              <div 
                key={`${alert.machineId}-${index}`}
                className="p-3 border-b border-sage/10 hover:bg-dark-foreground/50"
              >
                <div className="flex items-start">
                  <div className="h-2 w-2 mt-1.5 rounded-full bg-red-500 mr-2"></div>
                  <div>
                    <p className="text-white font-medium">Machine {alert.machineId}</p>
                    <p className="text-red-400 text-sm">
                      Total Current: {alert.value.toFixed(2)}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">{alert.timestamp}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertMenu;
