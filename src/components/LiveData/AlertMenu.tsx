import React, { useEffect, useState } from 'react';
import { Bell, BellRing, ChevronLeft, AlertCircle, Check, X, PowerOff, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export interface AlertItem {
  machineId: string;
  value?: number;
  timestamp: string;
  type: 'high-current' | 'downtime' | 'offline-status' | 'state-update-log' | 'machine-on';
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
  previousState?: string;
  newState?: string;
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
  const [filterType, setFilterType] = React.useState<string>('All Activity');
  const [machineStates, setMachineStates] = useState<MachineState[]>([]); // Track machine states
  const [generatedAlerts, setGeneratedAlerts] = useState<AlertItem[]>([]); // Dynamically generated alerts

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
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

  useEffect(() => {
    const newAlerts: AlertItem[] = [];

    machineStates.forEach((machine) => {
      const { machineId, state: currentState, totalCurrent } = machine;

      const ctValues = {
        ct1: totalCurrent * 0.3,
        ct2: totalCurrent * 0.3,
        ct3: totalCurrent * 0.4,
        ctAvg: totalCurrent / 3,
        totalCurrent
      };

      // Only add state-update-log alert if the state has actually changed (from "off" to "on")
      const existingStateAlert = generatedAlerts.find(
        (alert) => alert.machineId === machine.machineId && alert.type === 'state-update-log'
      );

      if (!existingStateAlert && currentState !== 'off') {  // Prevent alert if the state is still "off"
        newAlerts.push({
          machineId: machineId,
          timestamp: new Date().toISOString(),
          type: 'state-update-log',
          value: totalCurrent,
          isStatusUpdate: true,
          stateValues: ctValues
        });
      }

      // Check if the current totalCurrent exceeds the threshold
      if (machine.totalCurrent >= 15.0) {
        const existingAlert = generatedAlerts.find(
          (alert) => alert.machineId === machine.machineId && alert.type === 'high-current'
        );
        if (!existingAlert) {
          newAlerts.push({
            machineId: machine.machineId,
            value: machine.totalCurrent,
            timestamp: new Date().toISOString(),
            type: 'high-current'
          });
        }
      }
    });

    if (newAlerts.length > 0) {
      // Filter out incomplete or invalid alerts before updating the state
      const validAlerts = newAlerts.filter(alert => alert.machineId && alert.timestamp && alert.type);
      if (validAlerts.length > 0) {
        setGeneratedAlerts((prevAlerts) => [...prevAlerts, ...validAlerts]);
      }
    }
  }, [machineStates, generatedAlerts]);

  const allAlerts = [...currentAlerts, ...generatedAlerts];

  const downtimeAlertCount = allAlerts.filter((a) => a.type === 'downtime').length;
  const offlineStatusCount = allAlerts.filter((a) => a.type === 'offline-status').length;
  const highCurrentAlertCount = allAlerts.filter((a) => a.type === 'high-current').length;
  const stateUpdateLogCount = allAlerts.filter((a) => a.type === 'state-update-log').length;
  const machineOnAlertCount = allAlerts.filter((a) => a.type === 'machine-on').length;

  const sortedAlerts = [...allAlerts].sort((a, b) => {
    const dateA = a.onTimestamp ? new Date(a.onTimestamp).getTime() : new Date(a.timestamp).getTime();
    const dateB = b.onTimestamp ? new Date(b.onTimestamp).getTime() : new Date(b.timestamp).getTime();
    return dateB - dateA;
  });

  return (
    <Popover open={showAlerts} onOpenChange={setShowAlerts}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="border-sage text-sage hover:bg-sage/20 relative">
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
                <DropdownMenuItem onClick={() => setFilterType('High Current Alert')}>
                  High Current Alert ({highCurrentAlertCount})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType('Downtime Alert')}>
                  Downtime Alert ({downtimeAlertCount})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType('Offline Status')}>
                  Offline Status ({offlineStatusCount})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType('Machine ON Alert')}>
                  Machine ON Alert ({machineOnAlertCount})
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="max-h-[500px] overflow-y-auto">
            {sortedAlerts.length === 0 ? (
              <div className="p-4 text-center text-zinc-500">No alerts to display</div>
            ) : (
              sortedAlerts.map((alert, index) => {
                let alertType;
                if (alert.type === 'high-current') {
                  alertType = 'High Current Alert';
                } else if (alert.type === 'downtime') {
                  alertType = 'Downtime Alert';
                } else if (alert.type === 'offline-status') {
                  alertType = 'Offline Status';
                } else if (alert.type === 'machine-on') {
                  alertType = 'Machine ON Alert';
                } else {
                  console.log('Unknown alert type');
                }

                if (filterType !== 'All Activity' && filterType !== alertType) {
                  return null;
                }

                return (
                  <div
                    key={`${alert.machineId}-${index}-${alert.type}-${alert.timestamp}`}
                    className={cn(
                      'p-4 border-b border-zinc-200',
                      index % 2 === 0 ? 'bg-white' : 'bg-zinc-50',
                      alert.type === 'high-current' ? 'bg-red-50' : '',
                      alert.type === 'downtime' ? 'bg-blue-50' : '',
                      alert.type === 'offline-status' ? 'bg-orange-50' : '',
                      alert.type === 'state-update-log' ? 'bg-yellow-50' : '',
                      alert.type === 'machine-on' ? 'bg-emerald-50' : ''
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {alert.type === 'high-current' ? (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        ) : alert.type === 'state-update-log' ? (
                          <Clock className="h-4 w-4 text-yellow-500" />
                        ) : alert.type === 'machine-on' ? (
                          <PowerOff className="h-4 w-4 text-emerald-500" />
                        ) : null}
                        <span className="text-xs text-zinc-500">{alertType}</span>
                      </div>
                      <span className="text-xs text-zinc-400">
                        {new Date(alert.timestamp).toLocaleDateString()} · {formatTimestamp(alert.timestamp)}
                      </span>
                    </div>

                    <div className="mb-2">
                      <div className="font-medium text-zinc-800">
                        {alert.type === 'machine-on'
                          ? `Machine ${alert.machineId} is ON`
                          : alert.type === 'high-current'
                          ? `High Current on ${alert.machineId}`
                          : alert.type === 'downtime'
                          ? `Machine ${alert.machineId} Downtime Alert`
                          : alert.type === 'offline-status'
                          ? `${alert.machineId} Still Offline`
                          : alert.type === 'state-update-log'
                          ? `Machine ${alert.machineId} State Update`
                          : ''}
                      </div>

                      {alert.type === 'machine-on' && (
                        <div className="text-sm text-emerald-600">Current: {alert.value?.toFixed(2)} A</div>
                      )}

                      {alert.type === 'high-current' && (
                        <div className="text-sm text-red-600">Current: {alert.value?.toFixed(2)} A</div>
                      )}

                      {alert.type === 'downtime' && (
                        <div className="text-sm text-blue-600">Offline for: {formatDuration(alert.downtimeDuration || 0)}</div>
                      )}

                      {alert.type === 'state-update-log' && (
                        <div className="text-sm text-zinc-600">
                          Machine state updated with new CT values:
                          <div className="text-xs text-zinc-500 mt-1">CT1: {alert.stateValues?.ct1?.toFixed(2)} A</div>
                          <div className="text-xs text-zinc-500 mt-1">CT2: {alert.stateValues?.ct2?.toFixed(2)} A</div>
                          <div className="text-xs text-zinc-500 mt-1">CT3: {alert.stateValues?.ct3?.toFixed(2)} A</div>
                          <div className="text-xs text-zinc-500 mt-1">CT Average: {alert.stateValues?.ctAvg?.toFixed(2)} A</div>
                          <div className="text-xs text-zinc-500 mt-1">Total Current: {alert.stateValues?.totalCurrent?.toFixed(2)} A</div>
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
