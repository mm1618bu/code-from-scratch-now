
import { useState, useEffect } from 'react';
import { LiveDataItem } from '@/types/liveData';

export const useDataFiltering = (liveData: LiveDataItem[]) => {
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [machineIdFilter, setMachineIdFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc'); // Default sort is descending (newest first)
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [stateFilter, machineIdFilter]);

  const uniqueStates = ["all", ...Array.from(new Set(liveData.map(item => item.state)))];
  const uniqueMachineIds = ["all", ...Array.from(new Set(liveData.map(item => item.machineId)))];

  // Apply filters sequentially
  let filteredData = liveData;
  
  // Apply state filter
  if (stateFilter !== "all") {
    filteredData = filteredData.filter(item => item.state === stateFilter);
  }
  
  // Apply machine ID filter
  if (machineIdFilter !== "all") {
    filteredData = filteredData.filter(item => item.machineId === machineIdFilter);
  }

  // Apply sorting by created_at
  filteredData = [...filteredData].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    
    return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  
  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return {
    stateFilter,
    setStateFilter,
    machineIdFilter,
    setMachineIdFilter,
    currentPage,
    setCurrentPage,
    sortDirection,
    setSortDirection,
    uniqueStates,
    uniqueMachineIds,
    filteredData,
    totalPages,
    currentData,
    itemsPerPage
  };
};
