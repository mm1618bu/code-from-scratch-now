
// Constants for random selection
export const MACHINE_STATES = ['running', 'idle', 'error', 'maintenance', 'standby', 'off'];
export const MACHINE_IDS = ['MACH001', 'MACH002', 'MACH003', 'MACH004', 'MACH005', 'MACH006', 'MACH007', 'MACH008'];
export const FAULT_STATUSES = ['fault_detected', 'normal', 'warning', 'critical'];
export const TOTAL_CURRENT_THRESHOLD = 15.0; // Threshold for Total Current alert

// Helper function to get a random item from an array
export const getRandomItem = <T,>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

// Helper function to get a random float between min and max, with precision
export const getRandomFloat = (min: number, max: number, precision: number = 2): number => {
  const value = Math.random() * (max - min) + min;
  return parseFloat(value.toFixed(precision));
};

// Helper function to occasionally generate high Total Current values
export const generatePossiblyHighTotalCurrent = (): number => {
  // Increase chance to 50% to generate a value above threshold for testing
  if (Math.random() < 0.5) {
    return getRandomFloat(TOTAL_CURRENT_THRESHOLD, TOTAL_CURRENT_THRESHOLD + 15.0);
  }
  // Otherwise generate normal value
  return getRandomFloat(1.5, TOTAL_CURRENT_THRESHOLD - 1.0);
};

// Helper to check if a machine is considered offline
export const isMachineOffline = (data: Record<string, any>): boolean => {
  // A machine is offline if its state is "off"
  return data.state === "off";
};

// Function to force a specific machine to be offline for a specified duration
export const forceOfflineMachine = (machineId: string): void => {
  // Store in localStorage that this machine should be forced offline
  localStorage.setItem(`force_offline_${machineId}`, 'true');
  // Store the start time of the offline period
  localStorage.setItem(`offline_start_${machineId}`, new Date().toISOString());
  
  console.log(`Forcing machine ${machineId} to be offline starting now`);
};

// Function to check if a machine is currently being forced offline
export const isForceOfflineMachine = (machineId: string): boolean => {
  return localStorage.getItem(`force_offline_${machineId}`) === 'true';
};

// Function to clear the force offline state after the duration is complete
export const clearForceOfflineMachine = (machineId: string): string | null => {
  const wasForced = isForceOfflineMachine(machineId);
  const startTimeStr = localStorage.getItem(`offline_start_${machineId}`);
  
  // Clear the forced offline state
  localStorage.removeItem(`force_offline_${machineId}`);
  
  // If the machine was forced offline, return the start time for duration calculation
  if (wasForced && startTimeStr) {
    return startTimeStr;
  }
  
  return null;
};
