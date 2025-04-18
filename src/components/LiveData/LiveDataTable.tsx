
import React, { useState, useEffect } from 'react';
import { RefreshCw, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { LiveDataItem } from '@/types/liveData';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Progress } from "@/components/ui/progress";
import { isMachineOffline } from '@/utils/mockDataUtils';
import { Button } from '@/components/ui/button';

interface LiveDataTableProps {
  loading: boolean;
  currentData: LiveDataItem[];
  stateFilter: string;
  machineIdFilter: string;
  getStateColor: (state: string) => string;
  sortDirection?: 'asc' | 'desc';
  onSortChange?: () => void;
}

const LiveDataTable: React.FC<LiveDataTableProps> = ({
  loading,
  currentData,
  stateFilter,
  machineIdFilter,
  getStateColor,
  sortDirection = 'desc',
  onSortChange
}) => {
  // Store real-time durations with record IDs as keys
  const [realTimeDurations, setRealTimeDurations] = useState<Record<string, number>>({});

  // Update durations every second
  useEffect(() => {
    if (currentData.length === 0) return;

    // Initialize durations
    const initialDurations: Record<string, number> = {};
    currentData.forEach(item => {
      const recordId = item._id || `${item.machineId}-${item.created_at}`;
      const createdAt = new Date(item.created_at).getTime();
      const currentTime = new Date().getTime();
      const baseDuration = item.state_duration || 0;
      // Calculate seconds since record creation plus the base duration
      const secondsElapsed = Math.floor((currentTime - createdAt) / 1000);
      initialDurations[recordId] = baseDuration + secondsElapsed;
    });
    setRealTimeDurations(initialDurations);

    // Update durations every second
    const intervalId = setInterval(() => {
      setRealTimeDurations(prevDurations => {
        const newDurations = { ...prevDurations };
        // Increment each duration by 1 second
        Object.keys(newDurations).forEach(key => {
          newDurations[key] += 1;
        });
        return newDurations;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [currentData]);

  return (
    <div className="min-w-[1200px]">
      <Table className="border-collapse">
        <TableHeader className="sticky top-0 bg-dark z-10">
          <TableRow className="bg-dark-foreground/20 border-b border-dark-foreground/30">
            <TableHead className="text-gray-400 whitespace-nowrap">Machine ID</TableHead>
            <TableHead className="text-gray-400 whitespace-nowrap">State</TableHead>
            <TableHead className="text-gray-400 whitespace-nowrap">CT1</TableHead>
            <TableHead className="text-gray-400 whitespace-nowrap">CT2</TableHead>
            <TableHead className="text-gray-400 whitespace-nowrap">CT3</TableHead>
            <TableHead className="text-gray-400 whitespace-nowrap">CT Avg</TableHead>
            <TableHead className="text-gray-400 whitespace-nowrap">Total Current</TableHead>
            <TableHead className="text-gray-400 whitespace-nowrap">State Duration</TableHead>
            <TableHead className="text-gray-400 whitespace-nowrap">Fault Status</TableHead>
            <TableHead className="text-gray-400 whitespace-nowrap">FW Version</TableHead>
            <TableHead className="text-gray-400 whitespace-nowrap">MAC Address</TableHead>
            <TableHead className="text-gray-400 whitespace-nowrap group hover:bg-dark-foreground/30">
              <Button
                variant="ghost"
                size="sm"
                onClick={onSortChange}
                className="h-8 p-1 text-gray-400 whitespace-nowrap flex items-center gap-1"
              >
                Created At
                {sortDirection === 'asc' ? (
                  <ArrowUp className="h-4 w-4 ml-1 text-sage" />
                ) : (
                  <ArrowDown className="h-4 w-4 ml-1 text-sage" />
                )}
              </Button>
            </TableHead>
            <TableHead className="text-gray-400 whitespace-nowrap">Record ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={13} className="text-center py-8">
                <div className="flex flex-col items-center gap-4">
                  <RefreshCw className="h-8 w-8 animate-spin text-sage" />
                  <div className="w-64">
                    <Progress value={75} className="h-2 bg-dark-foreground/30" />
                  </div>
                  <p className="text-sage">Loading data from Supabase...</p>
                </div>
              </TableCell>
            </TableRow>
          ) : currentData.length > 0 ? (
            currentData.map((item, index) => {
              // Use the helper function to check if machine is offline
              const isOffline = item.state === 'off';
              const recordId = item._id || `${item.machineId}-${item.created_at}-${index}`;
              const realTimeDuration = realTimeDurations[recordId] || item.state_duration || 0;
              
              return (
                <TableRow 
                  key={recordId} 
                  className={`border-b border-dark-foreground/10 hover:bg-dark-foreground/5 ${
                    isOffline ? 'bg-blue-900/20' : 
                    item.total_current >= 15.0 ? 'bg-red-900/20' : ''
                  }`}
                >
                  <TableCell className="text-white font-medium">{item.machineId}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${getStateColor(item.state)}`}>
                      {item.state}
                    </span>
                  </TableCell>
                  <TableCell className={`text-gray-300 ${isOffline ? 'font-bold text-blue-400' : ''}`}>
                    {item.CT1}
                  </TableCell>
                  <TableCell className={`text-gray-300 ${isOffline ? 'font-bold text-blue-400' : ''}`}>
                    {item.CT2}
                  </TableCell>
                  <TableCell className={`text-gray-300 ${isOffline ? 'font-bold text-blue-400' : ''}`}>
                    {item.CT3}
                  </TableCell>
                  <TableCell className={`text-gray-300 ${isOffline ? 'font-bold text-blue-400' : ''}`}>
                    {item.CT_Avg}
                  </TableCell>
                  <TableCell className={
                    isOffline ? 'text-blue-400 font-bold' : 
                    item.total_current >= 15.0 ? 'text-red-400 font-bold' : 'text-gray-300'
                  }>
                    {item.total_current}
                    {isOffline && (
                      <span className="ml-2 px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">
                        OFFLINE
                      </span>
                    )}
                    {!isOffline && item.total_current >= 15.0 && (
                      <span className="ml-2 px-1.5 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">
                        HIGH
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-300">{realTimeDuration}s</TableCell>
                  <TableCell className="text-gray-300">{item.fault_status}</TableCell>
                  <TableCell className="text-gray-300">{item.fw_version}</TableCell>
                  <TableCell className="text-gray-300 font-mono text-xs">{item.mac}</TableCell>
                  <TableCell className="text-gray-300 whitespace-nowrap">
                    {new Date(item.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-gray-300 font-mono text-xs truncate max-w-[100px]">
                    {item._id}
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={13} className="text-center py-8 text-gray-400">
                {(stateFilter === "all" && machineIdFilter === "all") 
                  ? "No data available in Supabase" 
                  : `No data matches the selected filter${stateFilter !== "all" ? ` for state '${stateFilter}'` : ''}${machineIdFilter !== "all" ? ` and machine ID '${machineIdFilter}'` : ''}`}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default LiveDataTable;
