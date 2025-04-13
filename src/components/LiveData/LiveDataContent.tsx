
import React from 'react';
import { RefreshCw } from 'lucide-react';
import { LiveDataItem } from '@/types/liveData';
import { 
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { isMachineOffline } from '@/utils/mockDataUtils';

interface LiveDataContentProps {
  liveData: LiveDataItem[];
  loading: boolean;
}

const LiveDataContent: React.FC<LiveDataContentProps> = ({ liveData, loading }) => {
  return (
    <div className="bg-dark-foreground/10 p-6 rounded-lg">
      {liveData.length === 0 && !loading ? (
        <div className="p-8 text-center text-gray-400">
          <p>No data available. Try clicking "Start Mock Data" to generate some data.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table className="border-collapse">
            <TableCaption>Live data from Supabase collection</TableCaption>
            <TableHeader>
              <TableRow className="bg-dark-foreground/20 border-b border-dark-foreground/30">
                <TableHead className="text-gray-400">Machine ID</TableHead>
                <TableHead className="text-gray-400">State</TableHead>
                <TableHead className="text-gray-400">Timestamp</TableHead>
                <TableHead className="text-gray-400">Current Avg</TableHead>
                <TableHead className="text-gray-400">Total Current</TableHead>
                <TableHead className="text-gray-400">Fault Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex justify-center">
                      <RefreshCw className="h-8 w-8 animate-spin text-sage" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                liveData.map((item: any) => {
                  // Check if machine is in offline state
                  const isOffline = isMachineOffline(item);
                  
                  return (
                    <TableRow 
                      key={`${item.machineId}-${item.created_at}`} 
                      className={`border-b border-dark-foreground/10 hover:bg-dark-foreground/5 ${
                        isOffline ? 'bg-blue-900/20' : 
                        item.total_current >= 15.0 ? 'bg-red-900/20' : ''
                      }`}
                    >
                      <TableCell className="text-white">{item.machineId}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          isOffline ? 'bg-blue-500/20 text-blue-400' :
                          item.state === 'running' ? 'bg-green-500/20 text-green-400' :
                          item.state === 'idle' ? 'bg-blue-500/20 text-blue-400' :
                          item.state === 'error' ? 'bg-red-500/20 text-red-400' :
                          item.state === 'maintenance' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {isOffline ? 'off' : item.state}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {new Date(item.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className={`text-gray-400 ${isOffline ? 'font-bold text-blue-400' : ''}`}>
                        {isOffline ? '0' : (item.CT_Avg?.toFixed(2) || 'N/A')}
                      </TableCell>
                      <TableCell className={
                        isOffline ? 'text-blue-400 font-bold' : 
                        item.total_current >= 15.0 ? 'text-red-400 font-bold' : 'text-gray-400'
                      }>
                        {isOffline ? '0' : (item.total_current?.toFixed(2) || 'N/A')}
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
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          item.fault_status === 'normal' ? 'bg-green-500/20 text-green-400' :
                          item.fault_status === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                          item.fault_status === 'critical' ? 'bg-red-500/20 text-red-400' :
                          item.fault_status === 'fault_detected' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {item.fault_status || 'N/A'}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default LiveDataContent;
