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

const AlertMenu: React.FC<AlertMenuProps & { machineStates: MachineState[] }> = ({
  alertCount,
  showAlerts,
  setShowAlerts,
  currentAlerts,
  clearAlerts,
  machineStates,
}) => {
  const [generatedAlerts, setGeneratedAlerts] = useState<AlertItem[]>([]);

  useEffect(() => {
    const newAlerts: AlertItem[] = [];

    machineStates.forEach((machine) => {
      // Condition 1: Machine state changes from "off" to any other state
      if (machine.state !== "off") {
        const existingAlert = generatedAlerts.find(
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
        const existingAlert = generatedAlerts.find(
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

    if (newAlerts.length > 0) {
      setGeneratedAlerts((prevAlerts) => [...prevAlerts, ...newAlerts]);
    }
  }, [machineStates, generatedAlerts]);

  const allAlerts = [...currentAlerts, ...generatedAlerts];

  return (
    <Popover open={showAlerts} onOpenChange={setShowAlerts}>
      {/* Render alerts */}
    </Popover>
  );
};

export default AlertMenu;
