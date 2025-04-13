
import React from 'react';
import { Bell, BellRing, ChevronLeft, AlertCircle, Clock, Calendar, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

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
  const [readStatus, setReadStatus] = React.useState(false);
  const [filterType, setFilterType] = React.useState<string>("All Activity");
  
  const getAlertTypeIcon = (index: number) => {
    // Rotate between different alert types for demo purposes
    const iconType = index % 3;
    switch (iconType) {
      case 0: return <AlertCircle className="h-4 w-4 text-gray-400" />;
      case 1: return <Clock className="h-4 w-4 text-gray-400" />;
      case 2: return <Calendar className="h-4 w-4 text-gray-400" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };
  
  const getAlertTitle = (index: number, machineId: string) => {
    // Rotate between different alert titles for demo purposes
    const titleType = index % 4;
    switch (titleType) {
      case 0: return `Breakdown Detected`;
      case 1: return `${machineId} - Resin`;
      case 2: return `STARRAG - ${machineId}`;
      case 3: return `WaterJet - ${machineId}`;
      default: return `Machine ${machineId}`;
    }
  };
  
  const getAlertSubtitle = (index: number) => {
    // Rotate between different alert subtitles for demo purposes
    const subtitleType = index % 4;
    switch (subtitleType) {
      case 0: return "Connectivity";
      case 1: return "Utilization";
      case 2: return "Upcoming Reservation";
      case 3: return "Total Current";
      default: return "Alert";
    }
  };
  
  const getAlertDescription = (index: number, value: number) => {
    // Rotate between different alert descriptions for demo purposes
    const descType = index % 4;
    switch (descType) {
      case 0: 
        return "We noticed some unusual activity between 1:00 PM - 1:30 PM, was this a breakdown";
      case 1:
        return "Node disconnected at 12:55 AM";
      case 2:
        return "Your Equipment is Scheduled for a Task at 2:00 PM, 12/9/2023";
      case 3:
        return `Your Equipment was under utilized today compared to yesterday (${value.toFixed(2)} A)`;
      default:
        return `Total Current: ${value.toFixed(2)} A`;
    }
  };
  
  return (
    <Popover open={showAlerts} onOpenChange={setShowAlerts}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline"
          className="border-sage text-sage hover:bg-sage/20 relative"
        >
          {currentAlerts.length > 0 ? (
            <>
              <BellRing className="h-4 w-4 mr-2 animate-pulse" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {currentAlerts.length}
              </span>
            </>
          ) : (
            <Bell className="h-4 w-4 mr-2" />
          )}
          Alerts
        </Button>
      </PopoverTrigger>
      
      {currentAlerts.length > 0 && (
        <PopoverContent 
          className="w-[380px] p-0 bg-zinc-100 border border-sage/30 text-zinc-800 shadow-lg z-50" 
          align="end"
          side="bottom"
          sideOffset={5}
        >
          <div className="p-3 border-b border-zinc-200 flex justify-between items-center bg-white">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-0 h-8 w-8"
                onClick={() => setShowAlerts(false)}
              >
                <ChevronLeft className="h-4 w-4 text-zinc-600" />
              </Button>
              <h3 className="text-zinc-800 font-medium">Notifications</h3>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Read</span>
              <Switch
                checked={readStatus}
                onCheckedChange={setReadStatus}
                className="data-[state=checked]:bg-sage"
              />
            </div>
          </div>
          
          <div className="p-2 border-b border-zinc-200 bg-white">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs flex gap-1 items-center w-full justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-zinc-400">●</span>
                    <span>{filterType}</span>
                  </div>
                  <ChevronLeft className="h-3 w-3 rotate-270 text-zinc-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[200px]">
                <DropdownMenuItem onClick={() => setFilterType("All Activity")}>
                  All Activity
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("Analytics Alert")}>
                  Analytics Alert
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("Node Alert")}>
                  Node Alert
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("Schedule Alert")}>
                  Schedule Alert
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="max-h-[500px] overflow-y-auto">
            {currentAlerts.map((alert, index) => {
              const alertType = index % 3 === 0 ? "Analytics Alert" : 
                              index % 3 === 1 ? "Node Alert" : "Schedule Alert";
              const showAlert = filterType === "All Activity" || filterType === alertType;
              
              if (!showAlert) return null;
              
              return (
                <div 
                  key={`${alert.machineId}-${index}`}
                  className={cn(
                    "p-4 border-b border-zinc-200", 
                    index % 2 === 0 ? "bg-white" : "bg-zinc-50"
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getAlertTypeIcon(index)}
                      <span className="text-xs text-zinc-500">{alertType}</span>
                    </div>
                    <span className="text-xs text-zinc-400">Today · {new Date(alert.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  
                  <div className="mb-2">
                    <div className="font-medium text-zinc-800">{getAlertTitle(index, alert.machineId)}</div>
                    <div className="text-sm text-zinc-600">{getAlertSubtitle(index)}</div>
                    <div className="text-xs text-zinc-500 mt-1">{getAlertDescription(index, alert.value)}</div>
                  </div>
                  
                  {index % 4 === 0 && (
                    <div className="flex gap-2 mt-3">
                      <Button 
                        className="bg-teal-500 hover:bg-teal-600 text-white font-medium py-1 px-4 rounded text-sm h-9"
                      >
                        <Check className="h-4 w-4 mr-1" /> Yes
                      </Button>
                      <Button
                        className="bg-red-400 hover:bg-red-500 text-white font-medium py-1 px-4 rounded text-sm h-9"
                      >
                        <X className="h-4 w-4 mr-1" /> No
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="p-3 bg-white flex justify-center">
            <Button variant="ghost" size="sm" onClick={clearAlerts} className="text-zinc-500 hover:text-zinc-800">
              Clear All Notifications
            </Button>
          </div>
        </PopoverContent>
      )}
    </Popover>
  );
};

export default AlertMenu;
