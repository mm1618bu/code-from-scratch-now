
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Types for our notification system
export interface MachineStateChange {
  machineId: string;
  previousState: string;
  newState: string;
  timestamp: string;
}

export interface CTAlertNotification {
  machineId: string;
  ctAvg: number;
  timestamp: string;
}

export interface NotificationPreference {
  email: boolean;
  browser: boolean;
}

// Store user notification preferences in localStorage
export const getNotificationPreferences = (): NotificationPreference => {
  const stored = localStorage.getItem('notificationPreferences');
  if (stored) {
    return JSON.parse(stored);
  }
  // Default to both enabled
  return { email: true, browser: true };
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
    new Notification(title, options);
  } else {
    // Fallback to toast notification if permission not granted
    toast({
      title,
      description: options?.body || '',
    });
  }
};

// Request to send an email notification via Supabase edge function
export const sendEmailNotification = async (
  data: MachineStateChange | CTAlertNotification,
  isCTAlert: boolean = false
): Promise<void> => {
  const preferences = getNotificationPreferences();
  if (!preferences.email) {
    console.log('Email notifications disabled by user preferences');
    return;
  }
  
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user?.email) {
    console.error('No user email found for sending notifications');
    return;
  }
  
  try {
    if (isCTAlert) {
      const ctAlert = data as CTAlertNotification;
      const { error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          email: userData.user.email,
          machineId: ctAlert.machineId,
          alertType: 'CT_AVG_THRESHOLD',
          ctAvg: ctAlert.ctAvg,
          timestamp: ctAlert.timestamp
        }
      });
      
      if (error) {
        throw error;
      }
    } else {
      const stateChange = data as MachineStateChange;
      const { error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          email: userData.user.email,
          machineId: stateChange.machineId,
          previousState: stateChange.previousState,
          newState: stateChange.newState,
          timestamp: stateChange.timestamp
        }
      });
      
      if (error) {
        throw error;
      }
    }
    
    console.log('Email notification sent successfully');
  } catch (error) {
    console.error('Error sending email notification:', error);
    toast({
      title: 'Email Notification Error',
      description: 'Failed to send email notification',
      variant: 'destructive',
    });
  }
};

// Handle CT Average threshold alert
export const notifyCTAvgThresholdAlert = async (ctAlert: CTAlertNotification): Promise<void> => {
  // Send browser notification
  await sendBrowserNotification(
    `ALERT: Machine ${ctAlert.machineId} High CT Average`,
    {
      body: `CT Average value is ${ctAlert.ctAvg.toFixed(2)}, which exceeds the threshold of 15.0`,
      icon: '/favicon.ico',
      tag: `ct-avg-alert-${ctAlert.machineId}`,
      requireInteraction: true,
    }
  );
  
  // Send email notification
  await sendEmailNotification(ctAlert, true);
  
  // Also show a toast notification
  toast({
    title: `High CT Average Alert: Machine ${ctAlert.machineId}`,
    description: `CT Average value (${ctAlert.ctAvg.toFixed(2)}) exceeds threshold of 15.0`,
    variant: 'destructive',
  });
};

// Handle machine state change notification
export const notifyMachineStateChange = async (stateChange: MachineStateChange): Promise<void> => {
  // Send browser notification
  const hasChangedToError = stateChange.newState === 'error';
  const urgencyLevel = hasChangedToError ? 'Critical' : 'Info';
  
  await sendBrowserNotification(
    `${urgencyLevel}: Machine ${stateChange.machineId} State Change`,
    {
      body: `State changed from ${stateChange.previousState} to ${stateChange.newState}`,
      icon: '/favicon.ico',
      tag: `machine-state-${stateChange.machineId}`,
      requireInteraction: hasChangedToError,
    }
  );
  
  // Send email notification
  await sendEmailNotification(stateChange);
  
  // Also show a toast notification
  toast({
    title: `Machine ${stateChange.machineId} State Change`,
    description: `State changed from ${stateChange.previousState} to ${stateChange.newState}`,
    variant: hasChangedToError ? 'destructive' : 'default',
  });
};
