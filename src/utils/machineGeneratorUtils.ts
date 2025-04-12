
import { v4 as uuidv4 } from 'uuid';
import { MACHINE_STATES, FAULT_STATUSES, getRandomItem, getRandomFloat } from './mockDataUtils';
import { supabase } from '@/integrations/supabase/client';

// Current machine count to ensure we always get a new machine name
let currentMachineCount = 9;  // Starting from MACH009 as we already have MACH001-008

// Generate a unique machine ID that doesn't exist in the database
export const generateUniqueMachineId = async (): Promise<string> => {
  // Increment machine count to get a new machine ID
  currentMachineCount++;
  
  // Format with leading zeros (e.g., MACH009, MACH010, etc.)
  const machineId = `MACH${String(currentMachineCount).padStart(3, '0')}`;
  
  // Check if this machine ID already exists
  const { data } = await supabase
    .from('liveData')
    .select('machineId')
    .eq('machineId', machineId)
    .limit(1);
  
  // If machine ID already exists, recursively generate a new one
  if (data && data.length > 0) {
    console.log(`Machine ID ${machineId} already exists, generating new one`);
    return generateUniqueMachineId();
  }
  
  console.log(`Generated unique machine ID: ${machineId}`);
  return machineId;
};

// Generate initial data for a new machine
export const generateNewMachineData = async () => {
  const machineId = await generateUniqueMachineId();
  const state = getRandomItem(MACHINE_STATES);
  
  // Generate random values for currents
  const ct1 = getRandomFloat(0.5, 6.0);
  const ct2 = getRandomFloat(0.5, 6.0);
  const ct3 = Math.floor(getRandomFloat(0.0, 6.0)); // Integer for CT3 (bigint in DB)
  
  const ctAvg = getRandomFloat(0.5, 6.0);
  const totalCurrent = getRandomFloat(1.5, 14.0); // Keep below alert threshold for new machines
  
  const faultStatus = getRandomItem(FAULT_STATUSES);
  
  return {
    machineId,
    state,
    created_at: new Date().toISOString(),
    state_duration: Math.floor(Math.random() * 3600),
    total_current: totalCurrent,
    CT_Avg: ctAvg,
    CT1: ct1,
    CT2: ct2,
    CT3: ct3,
    fw_version: getRandomFloat(1.0, 5.0, 1),
    fault_status: faultStatus,
    mac: `00:1A:2B:${machineId.slice(-2)}:FF:EE`,
    hi: Math.floor(Math.random() * 100).toString(),
    _id: uuidv4() // Generate a unique ID for each new record
  };
};
