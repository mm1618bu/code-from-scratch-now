import { supabase } from "@/integrations/supabase/client";

// Types for our notification system
export interface MachineStateChange {
  machineId: string;
  previousState: string;
  newState: string;
  timestamp: string;
  totalCurrent?: number;
}

export interface TotalCurrentAlertNotification {
  machineId: string;
  totalCurrent: number;
  timestamp: string;
}

export interface MachineDowntimeNotification {
  machineId: string;
  offTimestamp: string;
  onTimestamp: string;
  downtimeDuration: number; // in minutes
}

export interface NotificationPreference {
  email: boolean;
  browser: boolean;
  push: boolean;
}

// Store user notification preferences in localStorage
export const getNotificationPreferences = (): NotificationPreference => {
  const stored = localStorage.getItem('notificationPreferences');
  if (stored) {
    return JSON.parse(stored);
  }
  // Default to browser notifications only, email disabled
  return { email: false, browser: true, push: true };
};

export const setNotificationPreferences = (preferences: NotificationPreference): void => {
  localStorage.setItem('notificationPreferences', JSON.stringify(preferences));
};

// Check if browser notifications are supported and permission is granted
export const areBrowserNotificationsAvailable = (): boolean => {
  return 'Notification' in window;
};

export const getBrowserNotificationPermission = async (): Promise<boolean> => {
  if (!areBrowserNotificationsAvailable()) {
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
};

// Send a browser notification
export const sendBrowserNotification = async (
  title: string, 
  options?: NotificationOptions
): Promise<void> => {
  const preferences = getNotificationPreferences();
  
  if (!preferences.browser) {
    console.log('Browser notifications disabled by user preferences');
    return;
  }
  
  const hasPermission = await getBrowserNotificationPermission();
  
  if (hasPermission) {
    console.log('Sending browser notification:', title, options);
    new Notification(title, options);
  } else {
    console.log('No permission for browser notifications');
  }
};

// Request to send an email notification via Supabase edge function
export const sendEmailNotification = async (
  data: MachineStateChange | TotalCurrentAlertNotification | MachineDowntimeNotification,
  notificationType: 'STATE_CHANGE' | 'TOTAL_CURRENT_THRESHOLD' | 'MACHINE_DOWNTIME' = 'STATE_CHANGE'
): Promise<void> => {
  const preferences = getNotificationPreferences();
  
  console.log(`${notificationType} email notification requested. Preferences:`, preferences);
  
  if (!preferences.email) {
    console.log('Email notifications disabled by user preferences');
    return;
  }
  
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData?.user?.email) {
    console.error('No user email found for sending notifications:', userData);
    return;
  }
  
  console.log(`Sending ${notificationType} email notification to:`, userData.user.email);
  
  try {
    if (notificationType === 'TOTAL_CURRENT_THRESHOLD') {
      const totalCurrentAlert = data as TotalCurrentAlertNotification;
      
      // Only send if total current is over threshold
      if (totalCurrentAlert.totalCurrent < 15.0) {
        console.log('Skipping email notification as total current is below threshold');
        return;
      }
      
      console.log("Invoking send-notification-email function for TOTAL_CURRENT_THRESHOLD");
      
      const { data: result, error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          email: userData.user.email,
          machineId: totalCurrentAlert.machineId,
          timestamp: totalCurrentAlert.timestamp,
          alertType: 'TOTAL_CURRENT_THRESHOLD',
          totalCurrent: totalCurrentAlert.totalCurrent
        }
      });
      
      if (error) {
        console.error("Error invoking send-notification-email:", error);
        throw error;
      }
      
      console.log("Email function response:", result);
    } else if (notificationType === 'MACHINE_DOWNTIME') {
      const downtimeAlert = data as MachineDowntimeNotification;
      
      console.log("Invoking send-notification-email function for MACHINE_DOWNTIME");
      
      const { data: result, error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          email: userData.user.email,
          machineId: downtimeAlert.machineId,
          offTimestamp: downtimeAlert.offTimestamp,
          onTimestamp: downtimeAlert.onTimestamp,
          downtimeDuration: downtimeAlert.downtimeDuration,
          alertType: 'MACHINE_DOWNTIME'
        }
      });
      
      if (error) {
        console.error("Error invoking send-notification-email:", error);
        throw error;
      }
      
      console.log("Email function response:", result);
    } else {
      const stateChange = data as MachineStateChange;
      
      // Skip if no total current is provided or it's below threshold
      if (!stateChange.totalCurrent || stateChange.totalCurrent < 15.0) {
        console.log('Skipping state change email as total current is below threshold');
        return;
      }
      
      console.log("Invoking send-notification-email function for STATE_CHANGE");
      
      const { data: result, error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          email: userData.user.email,
          machineId: stateChange.machineId,
          previousState: stateChange.previousState,
          newState: stateChange.newState,
          timestamp: stateChange.timestamp,
          alertType: 'STATE_CHANGE',
          totalCurrent: stateChange.totalCurrent
        }
      });
      
      if (error) {
        console.error("Error invoking send-notification-email:", error);
        throw error;
      }
      
      console.log("Email function response:", result);
    }
    
    console.log('Email notification sent successfully');
  } catch (error) {
    console.error('Error sending email notification:', error);
  }
};

// Check if the browser supports Push API
export const isPushNotificationSupported = (): boolean => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

// Send a push notification for Total Current threshold alert
export const sendPushNotification = async (alert: TotalCurrentAlertNotification): Promise<void> => {
  if (alert.totalCurrent < 15.0) {
    console.log('Skipping push notification as total current is below threshold');
    return;
  }
  
  const preferences = getNotificationPreferences();
  
  if (!preferences.push) {
    console.log('Push notifications disabled by user preferences');
    return;
  }
  
  if (!isPushNotificationSupported()) {
    console.log('Push notifications not supported in this browser');
    return;
  }
  
  try {
    console.log('Would send push notification for Total Current alert:', alert);
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};

// Machine downtime notification
export const notifyMachineDowntime = async (downtimeInfo: MachineDowntimeNotification): Promise<void> => {
  console.log(`Triggering notification for Machine Downtime: ${downtimeInfo.machineId}, duration: ${downtimeInfo.downtimeDuration} minutes`);
  
  // Log to console
  console.log(`Machine ${downtimeInfo.machineId} was offline for ${downtimeInfo.downtimeDuration} minutes (from ${new Date(downtimeInfo.offTimestamp).toLocaleString()} to ${new Date(downtimeInfo.onTimestamp).toLocaleString()})`);
  
  // Skip browser notification - no toast notifications for downtime
  
  // Send email notification
  await sendEmailNotification(downtimeInfo, 'MACHINE_DOWNTIME');
};

// Handle Total Current threshold alert
export const notifyTotalCurrentThresholdAlert = async (alert: TotalCurrentAlertNotification): Promise<void> => {
  if (alert.totalCurrent < 15.0) {
    console.log('Skipping total current alert notification as value is below threshold');
    return;
  }
  
  console.log(`Triggering notification for Total Current alert: ${alert.machineId}, value: ${alert.totalCurrent}`);
  
  // Log to console
  console.log(`Total Current Alert for Machine ${alert.machineId}: ${alert.totalCurrent.toFixed(2)} exceeds threshold of 15.0`);
  
  // Send email notification for high current alerts
  await sendEmailNotification(alert, 'TOTAL_CURRENT_THRESHOLD');
};

// Handle machine state change notification
export const notifyMachineStateChange = async (stateChange: MachineStateChange): Promise<void> => {
  if (!stateChange.totalCurrent || stateChange.totalCurrent < 15.0) {
    console.log('Skipping state change notification as total current is below threshold');
    return;
  }
  
  // Send browser notification
  const hasChangedToError = stateChange.newState === 'error';
  const urgencyLevel = hasChangedToError ? 'Critical' : 'Info';
  
  await sendBrowserNotification(
    `${urgencyLevel}: Machine ${stateChange.machineId} State Change (High Current)`,
    {
      body: `State changed from ${stateChange.previousState} to ${stateChange.newState}
Total Current: ${stateChange.totalCurrent.toFixed(2)}`,
      icon: '/favicon.ico',
      tag: `machine-state-${stateChange.machineId}`,
      requireInteraction: hasChangedToError,
    }
  );
  
  // Send email notification
  await sendEmailNotification(stateChange, 'STATE_CHANGE');
};

// In-memory storage for tracking machine offline status
interface OfflineMachineRecord {
  machineId: string;
  offTimestamp: string;
  isStillOffline: boolean;
  lastUpdated: string; // New field to track when we last reported about this machine
}

// In-memory map to track machine offline status
export const offlineMachinesMap = new Map<string, OfflineMachineRecord>();

// Check if a machine is considered offline based on current values
export const isMachineOffline = (data: Record<string, any>): boolean => {
  // Check if the state is explicitly "off" or if all current values are zero
  return (
    data.state === "off" ||
    (data.CT1 === 0 &&
    data.CT2 === 0 &&
    data.CT3 === 0 &&
    data.total_current === 0)
  );
};

// Track machine going offline
export const trackMachineOffline = (machineId: string, timestamp: string): void => {
  // Only track if not already tracking this machine
  if (!offlineMachinesMap.has(machineId)) {
    console.log(`Machine ${machineId} went offline at ${timestamp}`);
    offlineMachinesMap.set(machineId, {
      machineId,
      offTimestamp: timestamp,
      isStillOffline: true,
      lastUpdated: new Date().toISOString() // Initialize with current time
    });
  }
};

// Track machine coming back online and create notification
export const trackMachineOnline = async (machineId: string, timestamp: string): Promise<MachineDowntimeNotification | undefined> => {
  // Check if we were tracking this machine being offline
  const offlineRecord = offlineMachinesMap.get(machineId);
  
  if (offlineRecord && offlineRecord.isStillOffline) {
    // Calculate downtime in minutes
    const offTime = new Date(offlineRecord.offTimestamp).getTime();
    const onTime = new Date(timestamp).getTime();
    const downtimeMinutes = Math.round((onTime - offTime) / (1000 * 60));
    
    console.log(`Machine ${machineId} is back online after ${downtimeMinutes} minutes`);
    
    // Update record to no longer being offline
    offlineRecord.isStillOffline = false;
    offlineMachinesMap.set(machineId, offlineRecord);
    
    // Create and send downtime notification
    const downtimeInfo: MachineDowntimeNotification = {
      machineId,
      offTimestamp: offlineRecord.offTimestamp,
      onTimestamp: timestamp,
      downtimeDuration: downtimeMinutes
    };
    
    await notifyMachineDowntime(downtimeInfo);
    
    return downtimeInfo;
  }
  
  return undefined;
};

// New function to check offline machines status every 2 minutes
export const checkOfflineMachinesStatus = async (): Promise<(MachineDowntimeNotification | undefined)[]> => {
  console.log("Checking status of all offline machines");
  const currentTime = new Date().toISOString();
  const updates: (MachineDowntimeNotification | undefined)[] = [];
  
  // Check each machine that's marked as still offline
  for (const [machineId, record] of offlineMachinesMap.entries()) {
    if (record.isStillOffline) {
      // Calculate how long it's been offline so far
      const offTime = new Date(record.offTimestamp).getTime();
      const currentTimeMs = new Date().getTime();
      const currentDowntimeMinutes = Math.round((currentTimeMs - offTime) / (1000 * 60));
      
      // Calculate time since last report
      const lastUpdatedTime = new Date(record.lastUpdated).getTime();
      const timeSinceLastUpdateMinutes = Math.round((currentTimeMs - lastUpdatedTime) / (1000 * 60));
      
      console.log(`Machine ${machineId} has been offline for ${currentDowntimeMinutes} minutes. Last reported ${timeSinceLastUpdateMinutes} minutes ago.`);
      
      // If it's been more than 2 minutes since our last update about this machine, generate a new update
      if (timeSinceLastUpdateMinutes >= 2) {
        // Create a periodic update notification
        const downtimeInfo: MachineDowntimeNotification = {
          machineId,
          offTimestamp: record.offTimestamp,
          onTimestamp: currentTime, // Use current time for the report
          downtimeDuration: currentDowntimeMinutes
        };
        
        // Update the last reported time
        record.lastUpdated = currentTime;
        offlineMachinesMap.set(machineId, record);
        
        // Add to updates list
        updates.push(downtimeInfo);
        
        console.log(`Generated 2-minute update for offline machine ${machineId}: offline for ${currentDowntimeMinutes} minutes`);
        
        // Send a browser notification for the offline machine
        await sendBrowserNotification(
          `Machine ${machineId} Still Offline`,
          {
            body: `Machine has been offline for ${currentDowntimeMinutes} minutes since ${new Date(record.offTimestamp).toLocaleString()}`,
            icon: '/favicon.ico',
            tag: `machine-offline-${machineId}`,
            requireInteraction: currentDowntimeMinutes > 10, // Require interaction for machines offline more than 10 minutes
          }
        );
      }
    }
  }
  
  return updates;
};
