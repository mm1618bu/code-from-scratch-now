import React, { useState } from 'react';
import MockDataGenerator from './MockDataGenerator';
import AlertMenu from './LiveData/AlertMenu';

const ParentComponent = () => {
  const [machineStates, setMachineStates] = useState([]);
  const [alertCount, setAlertCount] = useState(0);
  const [showAlerts, setShowAlerts] = useState(false);
  const [currentAlerts, setCurrentAlerts] = useState([]);

  const clearAlerts = () => {
    setCurrentAlerts([]);
    setAlertCount(0);
  };

      <AlertMenu 
        machineStates={machineStates} 
        alertCount={alertCount} 
        showAlerts={showAlerts} 
        setShowAlerts={setShowAlerts} 
        currentAlerts={currentAlerts} 
        clearAlerts={clearAlerts} 
      />

  return (
    <div>
      <MockDataGenerator onMachineStateChange={setMachineStates} />
      <AlertMenu 
        machineStates={machineStates} 
        alertCount={alertCount} 
        showAlerts={showAlerts} 
        setShowAlerts={setShowAlerts} 
        currentAlerts={currentAlerts} 
        clearAlerts={clearAlerts} 
      />
    </div>
  );
};

export default ParentComponent;