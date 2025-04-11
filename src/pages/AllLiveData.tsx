
import React, { useState } from 'react';
import SageLogo from '@/components/SageLogo';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, RefreshCw, Database, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Mock data representing MongoDB liveData collection
const MOCK_LIVE_DATA = [
  { 
    _id: '6071e8f68f25e32e7c9c5b01', 
    machineId: 'MACH001', 
    state: 'running', 
    CT1: 4.52, 
    CT2: 3.87, 
    CT3: 6, 
    CT_Avg: 4.21, 
    total_current: 12.45, 
    state_duration: 3600,
    fault_status: 'none',
    fw_version: 1.2,
    mac: '00:1B:44:11:3A:B7',
    created_at: '2025-04-10T14:30:00Z'
  },
  { 
    _id: '6071e8f68f25e32e7c9c5b02', 
    machineId: 'MACH002', 
    state: 'idle', 
    CT1: 0.12, 
    CT2: 0.08, 
    CT3: 0, 
    CT_Avg: 0.07, 
    total_current: 0.2, 
    state_duration: 1800,
    fault_status: 'none',
    fw_version: 1.2,
    mac: '00:1B:44:11:3A:B8',
    created_at: '2025-04-11T09:15:00Z'
  },
  { 
    _id: '6071e8f68f25e32e7c9c5b03', 
    machineId: 'MACH003', 
    state: 'error', 
    CT1: 0.0, 
    CT2: 0.0, 
    CT3: 0, 
    CT_Avg: 0.0, 
    total_current: 0.0, 
    state_duration: 7200,
    fault_status: 'sensor_fault',
    fw_version: 1.1,
    mac: '00:1B:44:11:3A:B9',
    created_at: '2025-04-09T16:45:00Z'
  },
  { 
    _id: '6071e8f68f25e32e7c9c5b04', 
    machineId: 'MACH001', 
    state: 'running', 
    CT1: 4.67, 
    CT2: 3.92, 
    CT3: 6, 
    CT_Avg: 4.30, 
    total_current: 12.59, 
    state_duration: 1200,
    fault_status: 'none',
    fw_version: 1.2,
    mac: '00:1B:44:11:3A:B7',
    created_at: '2025-04-10T15:30:00Z'
  },
  { 
    _id: '6071e8f68f25e32e7c9c5b05', 
    machineId: 'MACH004', 
    state: 'maintenance', 
    CT1: 0.05, 
    CT2: 0.03, 
    CT3: 0, 
    CT_Avg: 0.03, 
    total_current: 0.08, 
    state_duration: 3600,
    fault_status: 'maintenance_mode',
    fw_version: 1.3,
    mac: '00:1B:44:11:3A:C1',
    created_at: '2025-04-08T13:10:00Z'
  },
  { 
    _id: '6071e8f68f25e32e7c9c5b06', 
    machineId: 'MACH002', 
    state: 'running', 
    CT1: 3.87, 
    CT2: 4.12, 
    CT3: 5, 
    CT_Avg: 4.01, 
    total_current: 11.99, 
    state_duration: 900,
    fault_status: 'none',
    fw_version: 1.2,
    mac: '00:1B:44:11:3A:B8',
    created_at: '2025-04-11T10:20:00Z'
  },
  { 
    _id: '6071e8f68f25e32e7c9c5b07', 
    machineId: 'MACH005', 
    state: 'standby', 
    CT1: 0.24, 
    CT2: 0.19, 
    CT3: 0, 
    CT_Avg: 0.14, 
    total_current: 0.43, 
    state_duration: 600,
    fault_status: 'none',
    fw_version: 1.2,
    mac: '00:1B:44:11:3A:D2',
    created_at: '2025-04-10T17:45:00Z'
  },
];

const AllLiveData: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [liveData, setLiveData] = useState(MOCK_LIVE_DATA);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(liveData.length / itemsPerPage);
  const currentData = liveData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleRefreshData = () => {
    setLoading(true);
    
    // Simulate API fetch delay
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Data Refreshed",
        description: "Live data has been refreshed from MongoDB",
      });
    }, 800);
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'running':
        return 'bg-green-500/20 text-green-500 border border-green-500/50';
      case 'idle':
        return 'bg-blue-500/20 text-blue-500 border border-blue-500/50';
      case 'error':
        return 'bg-red-500/20 text-red-500 border border-red-500/50';
      case 'maintenance':
        return 'bg-amber-500/20 text-amber-500 border border-amber-500/50';
      case 'standby':
        return 'bg-purple-500/20 text-purple-500 border border-purple-500/50';
      default:
        return 'bg-gray-500/20 text-gray-500 border border-gray-500/50';
    }
  };

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

      <div className="flex-grow w-full max-w-7xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Database className="h-6 w-6 mr-2 text-sage" />
            <h1 className="text-white text-2xl font-bold">MongoDB Live Data</h1>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => navigate('/mongodb')}
              variant="outline"
              className="border-sage text-sage hover:bg-sage/20"
            >
              MongoDB Dashboard
            </Button>
            
            <Button 
              onClick={handleRefreshData} 
              variant="outline" 
              disabled={loading}
              className="border-sage text-sage hover:bg-sage/20"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </>
              )}
            </Button>
          </div>
        </div>
        
        <div className="bg-dark-foreground/10 p-6 rounded-lg">
          <div className="p-4 bg-amber-500/20 border border-amber-500/50 rounded-lg mb-6">
            <div className="flex items-start">
              <div>
                <p className="text-gray-300 text-sm">
                  This table displays a comprehensive view of all liveData records from MongoDB. 
                  In a production application, this data would be fetched from your MongoDB database via a backend API.
                </p>
              </div>
            </div>
          </div>

          <ScrollArea className="h-[500px] rounded-md border border-dark-foreground/20">
            <Table className="border-collapse">
              <TableCaption>Comprehensive MongoDB liveData collection</TableCaption>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentData.map((item) => (
                  <TableRow key={item._id} className="border-b border-dark-foreground/10 hover:bg-dark-foreground/5">
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
                    <TableCell className="text-gray-300">{item.total_current}</TableCell>
                    <TableCell className="text-gray-300">{item.state_duration}s</TableCell>
                    <TableCell className="text-gray-300">{item.fault_status}</TableCell>
                    <TableCell className="text-gray-300">{item.fw_version}</TableCell>
                    <TableCell className="text-gray-300 font-mono text-xs">{item.mac}</TableCell>
                    <TableCell className="text-gray-300 whitespace-nowrap">
                      {new Date(item.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
          
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className={currentPage === 1 ? "opacity-50 pointer-events-none" : "text-sage hover:bg-sage/20"}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => setCurrentPage(page)}
                    isActive={page === currentPage}
                    className={page === currentPage ? "bg-sage text-white hover:bg-sage/90" : "text-white"}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages ? "opacity-50 pointer-events-none" : "text-sage hover:bg-sage/20"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>

        {user && (
          <div className="p-4 bg-dark-foreground/10 rounded-lg mt-6">
            <p className="text-gray-400">Current user: {user.email}</p>
          </div>
        )}
      </div>

      <footer className="w-full p-6 mt-auto text-center">
        <p className="text-gray-400 text-sm">
          Need help? <a href="#" className="text-sage hover:underline">Contact Support</a>
        </p>
      </footer>
    </div>
  );
};

export default AllLiveData;
