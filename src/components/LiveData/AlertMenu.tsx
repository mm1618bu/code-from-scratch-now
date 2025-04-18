import React, { useEffect, useState } from 'react';
import { Bell, BellRing, ChevronLeft, AlertCircle, Clock, Calendar, Check, X, PowerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export interface AlertItem {
  machineId: string;
  value?: number;
  timestamp: string;
  type: 'high-current' | 'downtime' | 'offline-status' | 'state-change';
  downtimeDuration?: number;
  offTimestamp?: string;
  onTimestamp?: string;
  isStatusUpdate?: boolean;
}

interface MachineState {
  machineId: string;
  state: string; // e.g., "off", "on", "running"
  totalCurrent: number; // Current in Amperes
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
  const [machineStates, setMachineStates] = useState<MachineState[]>([]); // Track machine states
  const [generatedAlerts, setGeneratedAlerts] = useState<AlertItem[]>([]); // Dynamically generated alerts

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min${minutes !== 1 ? 's' : ''}`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours} hr${hours !== 1 ? 's' : ''} ${remainingMinutes} min${remainingMinutes !== 1 ? 's' : ''}`;
    }
  };

  // Function to monitor machine states and generate alerts
  useEffect(() => {
    const newAlerts: AlertItem[] = [];

    machineStates.forEach((machine) => {
      // Condition 1: Machine state changes from "off" to any other state
      if (machine.state !== "off") {
        const existingAlert = currentAlerts.find(
          (alert) =>
            alert.machineId === machine.machineId &&
            alert.type === "state-change"
        );
        if (!existingAlert) {
          newAlerts.push({
            machineId: machine.machineId,
            timestamp: new Date().toISOString(),
            type: "state-change",
          });
        }
      }

      // Condition 2: Total current is 15.0 or above
      if (machine.totalCurrent >= 15.0) {
        const existingAlert = currentAlerts.find(
          (alert) =>
            alert.machineId === machine.machineId &&
            alert.type === "high-current"
        );
        if (!existingAlert) {
          newAlerts.push({
            machineId: machine.machineId,
            value: machine.totalCurrent,
            timestamp: new Date().toISOString(),
            type: "high-current",
          });
        }
      }
    });

    // Update the generated alerts
    setGeneratedAlerts((prevAlerts) => [...prevAlerts, ...newAlerts]);
  }, [machineStates, currentAlerts]);

  // Combine current alerts and dynamically generated alerts
  const allAlerts = [...currentAlerts, ...generatedAlerts];

  // Count alerts by type
  const downtimeAlertCount = allAlerts.filter(a => a.type === 'downtime').length;
  const offlineStatusCount = allAlerts.filter(a => a.type === 'offline-status').length;
  const highCurrentAlertCount = allAlerts.filter(a => a.type === 'high-current').length;
  const stateChangeAlertCount = allAlerts.filter(a => a.type === 'state-change').length;

  // Sort alerts to show newest first
  const sortedAlerts = [...allAlerts].sort((a, b) => {
    const dateA = a.onTimestamp ? new Date(a.onTimestamp).getTime() : new Date(a.timestamp).getTime();
    const dateB = b.onTimestamp ? new Date(b.onTimestamp).getTime() : new Date(b.timestamp).getTime();
    return dateB - dateA;
  });

  return (
    <Popover open={showAlerts} onOpenChange={setShowAlerts}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline"
          className="border-sage text-sage hover:bg-sage/20 relative"
        >
          {allAlerts.length > 0 ? (
            <>
              <BellRing className="h-4 w-4 mr-2 animate-pulse" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {allAlerts.length}
              </span>
            </>
          ) : (
            <Bell className="h-4 w-4 mr-2" />
          )}
          Alerts
        </Button>
      </PopoverTrigger>
      
      {allAlerts.length > 0 && (
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
              <DropdownMenuContent className="w-[200px] bg-white">
                <DropdownMenuItem onClick={() => setFilterType("All Activity")}>
                  All Activity ({allAlerts.length})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("High Current Alert")}>
                  High Current Alert ({highCurrentAlertCount})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("Downtime Alert")}>
                  Downtime Alert ({downtimeAlertCount})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("Offline Status")}>
                  Offline Status ({offlineStatusCount})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("State Change")}>
                  State Change ({stateChangeAlertCount})
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="max-h-[500px] overflow-y-auto">
            {sortedAlerts.length === 0 ? (
              <div className="p-4 text-center text-zinc-500">
                No alerts to display
              </div>
            ) : (
              sortedAlerts.map((alert, index) => {
                let alertType;
                if (alert.type === 'high-current') {
                  alertType = "High Current Alert";
                } else if (alert.type === 'downtime') {
                  alertType = "Downtime Alert";
                } else if (alert.type === 'offline-status') {
                  alertType = "Offline Status";
                } else if (alert.type === 'state-change') {
                  alertType = "State Change";
                } else {
                  alertType = "Node Alert";
                }
                
                // Skip if filtered and not matching the selected filter
                if (filterType !== "All Activity" && filterType !== alertType) {
                  return null;
                }
                
                return (
                  <div 
                    key={`${alert.machineId}-${index}-${alert.type}-${alert.timestamp}`}
                    className={cn(
                      "p-4 border-b border-zinc-200", 
                      index % 2 === 0 ? "bg-white" : "bg-zinc-50",
                      alert.type === 'downtime' ? "bg-blue-50" : "",
                      alert.type === 'offline-status' ? "bg-orange-50" : "",
                      alert.type === 'state-change' ? "bg-green-50" : ""
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {alert.type === 'high-current' ? (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        ) : alert.type === 'state-change' ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <PowerOff className="h-4 w-4 text-blue-500" />
                        )}
                        <span className="text-xs text-zinc-500">{alertType}</span>
                      </div>
                      <span className="text-xs text-zinc-400">
                        {new Date(alert.type === 'downtime' && alert.onTimestamp ? 
                          alert.onTimestamp : alert.timestamp).toLocaleDateString()} · 
                        {formatTimestamp(alert.type === 'downtime' && alert.onTimestamp ? 
                          alert.onTimestamp : alert.timestamp)}
                      </span>
                    </div>
                    
                    <div className="mb-2">
                      <div className="font-medium text-zinc-800">
                        {alert.type === 'high-current' 
                          ? `High Current on ${alert.machineId}` 
                          : alert.type === 'offline-status'
                          ? `${alert.machineId} Still Offline`
                          : alert.type === 'state-change'
                          ? `Machine ${alert.machineId} State Changed`
                          : `${alert.machineId} Downtime Alert`}
                      </div>
                      
                      {alert.type === 'high-current' && (
                        <div className="text-sm text-zinc-600">
                          Current Threshold Exceeded
                          <div className="text-xs text-zinc-500 mt-1">
                            {`Total Current: ${alert.value?.toFixed(2)} A`}
                            {alert.value && alert.value >= 15 && 
                              <span className="text-red-500 ml-1">(Above threshold of 15.0 A)</span>
                            }
                          </div>
                        </div>
                      )}
                      
                      {alert.type === 'downtime' && (
                        <div className="text-sm text-zinc-600">
                          Machine was offline
                          <div className="text-xs text-zinc-500 mt-1 flex flex-col gap-1">
                            <span className="font-semibold text-blue-700">
                              Offline for {formatDuration(alert.downtimeDuration || 0)}
                            </span>
                            <span>
                              <span className="font-medium">From:</span> {new Date(alert.offTimestamp || '').toLocaleString()}
                            </span>
                            <span>
                              <span className="font-medium">To:</span> {new Date(alert.onTimestamp || '').toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {alert.type === 'offline-status' && (
                        <div className="text-sm text-zinc-600">
                          Machine is still offline
                          <div className="text-xs text-zinc-500 mt-1 flex flex-col gap-1">
                            <span className="font-semibold text-orange-700">
                              Offline for {formatDuration(alert.downtimeDuration || 0)} and counting
                            </span>
                            <span>
                              <span className="font-medium">Since:</span> {new Date(alert.offTimestamp || '').toLocaleString()}
                            </span>
                            <span className="text-orange-600 font-medium">
                              Machine still not back online
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {alert.type === 'state-change' && (
                        <div className="text-sm text-zinc-600">
                          Machine has switched from "off" to "on"
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 mt-3">
                      <Button 
                        className="bg-teal-500 hover:bg-teal-600 text-white font-medium py-1 px-4 rounded text-sm h-9"
                      >
                        <Check className="h-4 w-4 mr-1" /> Acknowledged
                      </Button>
                      <Button
                        variant="outline"
                        className="border-red-400 text-red-500 hover:bg-red-50 font-medium py-1 px-4 rounded text-sm h-9"
                      >
                        <X className="h-4 w-4 mr-1" /> Ignore
                      </Button>
                    </div>
                  </div>
                );
              }).filter(Boolean)
            )}
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
