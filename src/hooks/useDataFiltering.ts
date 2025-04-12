
import { useState, useEffect } from 'react';
import { LiveDataItem } from '@/types/liveData';

export const useDataFiltering = (liveData: LiveDataItem[]) => {
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [stateFilter]);

  const uniqueStates = ["all", ...Array.from(new Set(liveData.map(item => item.state)))];

  const filteredData = stateFilter === "all" 
    ? liveData 
    : liveData.filter(item => item.state === stateFilter);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  
  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return {
    stateFilter,
    setStateFilter,
    currentPage,
    setCurrentPage,
    uniqueStates,
    filteredData,
    totalPages,
    currentData,
    itemsPerPage
  };
};
