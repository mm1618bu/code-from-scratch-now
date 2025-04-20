
import React, { useEffect, useState } from 'react';
import { Bell, BellRing, ChevronLeft, AlertCircle, PowerOff, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export interface AlertItem {
  machineId: string;
  value?: number;
  timestamp: string;
  type: 'high-current' | 'downtime' | 'offline-status' | 'machine-on';
  downtimeDuration?: number;
  offTimestamp?: string;
  onTimestamp?: string;
  isStatusUpdate?: boolean;
  stateValues?: {
    ct1: number;
    ct2: number;
    ct3: number;
    ctAvg: number;
    totalCurrent: number;
  };
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

  // Count alerts by type
  const machineOnAlertCount = currentAlerts.filter(a => a.type === 'machine-on').length;
  const downtimeAlertCount = currentAlerts.filter(a => a.type === 'downtime').length;
  const offlineStatusCount = currentAlerts.filter(a => a.type === 'offline-status').length;
  const highCurrentAlertCount = currentAlerts.filter(a => a.type === 'high-current').length;

  // Sort alerts to show newest first
  const sortedAlerts = [...currentAlerts].sort((a, b) => {
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
              <DropdownMenuContent className="w-[200px] bg-white">
                <DropdownMenuItem onClick={() => setFilterType("All Activity")}>
                  All Activity ({currentAlerts.length})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("Machine ON")}>
                  Machine ON ({machineOnAlertCount})
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
                if (alert.type === "machine-on") {
                  alertType = "Machine ON";
                } else if (alert.type === "high-current") {
                  alertType = "High Current Alert";
                } else if (alert.type === "downtime") {
                  alertType = "Downtime Alert";
                } else if (alert.type === "offline-status") {
                  alertType = "Offline Status";
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
                      alert.type === "machine-on" ? "bg-emerald-50" : "",
                      alert.type === "high-current" ? "bg-red-50" : "",
                      alert.type === "downtime" ? "bg-blue-50" : "",
                      alert.type === "offline-status" ? "bg-orange-50" : ""
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {alert.type === "machine-on" ? (
                          <Clock className="h-4 w-4 text-emerald-500" />
                        ) : alert.type === "high-current" ? (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <PowerOff className="h-4 w-4 text-blue-500" />
                        )}
                        <span className="text-xs text-zinc-500">{alertType}</span>
                      </div>
                      <span className="text-xs text-zinc-400">
                        {new Date(alert.timestamp).toLocaleDateString()} ·{" "}
                        {formatTimestamp(alert.timestamp)}
                      </span>
                    </div>

                    <div className="mb-2">
                      <div className="font-medium text-zinc-800">
                        {alert.type === "machine-on"
                          ? `Machine ${alert.machineId} is ON (Current: ${alert.value}A)`
                          : alert.type === "high-current"
                          ? `High Current on ${alert.machineId} (${alert.value}A)`
                          : alert.type === "offline-status"
                          ? `${alert.machineId} Still Offline`
                          : `${alert.machineId} Downtime Alert`}
                      </div>
                      {(alert.type === 'downtime' || alert.type === 'offline-status') && alert.downtimeDuration && (
                        <div className="text-sm text-zinc-600 mt-1">
                          Duration: {formatDuration(alert.downtimeDuration)}
                        </div>
                      )}
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
