
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

interface LiveDataTableProps {
  loading: boolean;
  currentData: LiveDataItem[];
  stateFilter: string;
  machineIdFilter: string;
  getStateColor: (state: string) => string;
}

const LiveDataTable: React.FC<LiveDataTableProps> = ({
  loading,
  currentData,
  stateFilter,
  machineIdFilter,
  getStateColor
}) => {
  return (
    <div className="min-w-[1200px]">
      <Table className="border-collapse">
        <TableCaption>Comprehensive Supabase liveData collection</TableCaption>
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
            <TableHead className="text-gray-400 whitespace-nowrap">Created At</TableHead>
            <TableHead className="text-gray-400 whitespace-nowrap">Record ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={13} className="text-center py-8">
                <div className="flex justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-sage" />
                </div>
              </TableCell>
            </TableRow>
          ) : currentData.length > 0 ? (
            currentData.map((item, index) => (
              <TableRow 
                key={item._id || `${item.machineId}-${item.created_at}-${index}`} 
                className={`border-b border-dark-foreground/10 hover:bg-dark-foreground/5 ${
                  item.total_current >= 15.0 ? 'bg-red-900/20' : ''
                }`}
              >
                <TableCell className="text-white font-medium">{item.machineId}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${getStateColor(item.state)}`}>
                    {item.state}
                  </span>
                </TableCell>
                <TableCell className="text-gray-300">{item.CT1}</TableCell>
                <TableCell className="text-gray-300">{item.CT2}</TableCell>
                <TableCell className="text-gray-300">{item.CT3}</TableCell>
                <TableCell className="text-gray-300">{item.CT_Avg}</TableCell>
                <TableCell className={item.total_current >= 15.0 ? 'text-red-400 font-bold' : 'text-gray-300'}>
                  {item.total_current}
                  {item.total_current >= 15.0 && (
                    <span className="ml-2 px-1.5 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">
                      HIGH
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-gray-300">{item.state_duration}s</TableCell>
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
            ))
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
