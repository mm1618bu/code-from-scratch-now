
import { toast } from "@/hooks/use-toast";
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
    // Removed fallback to toast notification
  }
};

// Request to send an email notification via Supabase edge function
export const sendEmailNotification = async (
  data: MachineStateChange | TotalCurrentAlertNotification,
  isTotalCurrentAlert: boolean = false
): Promise<void> => {
  const preferences = getNotificationPreferences();
  
  console.log("Email notification requested. Preferences:", preferences);
  
  if (!preferences.email) {
    console.log('Email notifications disabled by user preferences');
    return;
  }
  
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData?.user?.email) {
    console.error('No user email found for sending notifications:', userData);
    // Removed toast notification here
    return;
  }
  
  console.log("Sending email notification to:", userData.user.email);
  
  try {
    if (isTotalCurrentAlert) {
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
    
    // Removed success toast notification
    
    console.log('Email notification sent successfully');
  } catch (error) {
    console.error('Error sending email notification:', error);
    // Removed error toast notification
  }
};

// Check if the browser supports Push API
export const isPushNotificationSupported = (): boolean => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

// Send a push notification for Total Current threshold alert
export const sendPushNotification = async (alert: TotalCurrentAlertNotification): Promise<void> => {
  // Skip if total current is below threshold
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
    // In a real implementation, we would register a service worker and send push notifications
    // For now, we'll just log to console
    console.log('Would send push notification for Total Current alert:', alert);
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};

// Handle Total Current threshold alert
export const notifyTotalCurrentThresholdAlert = async (alert: TotalCurrentAlertNotification): Promise<void> => {
  // Skip if total current is below threshold
  if (alert.totalCurrent < 15.0) {
    console.log('Skipping total current alert notification as value is below threshold');
    return;
  }
  
  console.log(`Triggering notification for Total Current alert: ${alert.machineId}, value: ${alert.totalCurrent}`);
  
  // Log to console
  console.log(`Total Current Alert for Machine ${alert.machineId}: ${alert.totalCurrent.toFixed(2)} exceeds threshold of 15.0`);
  
  // Send email notification for high current alerts
  await sendEmailNotification(alert, true);
};

// Handle machine state change notification
export const notifyMachineStateChange = async (stateChange: MachineStateChange): Promise<void> => {
  // Skip if no total current is provided or it's below threshold
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
  await sendEmailNotification(stateChange);
};
