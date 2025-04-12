
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  getBrowserNotificationPermission, 
  getNotificationPreferences, 
  setNotificationPreferences, 
  areBrowserNotificationsAvailable
} from '@/lib/notification';
import { Bell, BellOff, Mail, AlertCircle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { supabase } from '@/integrations/supabase/client';

const NotificationSettings: React.FC = () => {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState(getNotificationPreferences());
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'default'>('default');
  const [browserSupported, setBrowserSupported] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const checkNotificationSupport = async () => {
      const supported = areBrowserNotificationsAvailable();
      setBrowserSupported(supported);
      
      if (supported) {
        setPermissionStatus(Notification.permission);
        // Get initial permission status
        await getBrowserNotificationPermission();
        // Update status after any potential permission request
        setPermissionStatus(Notification.permission);
      }
    };
    
    const getUserEmail = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.email) {
        setUserEmail(data.user.email);
      }
    };
    
    checkNotificationSupport();
    getUserEmail();
  }, []);

  const handleBrowserToggle = async (checked: boolean) => {
    if (checked && browserSupported) {
      const granted = await getBrowserNotificationPermission();
      if (!granted) {
        toast({
          title: "Permission Denied",
          description: "Browser notifications were denied. Please update your browser settings.",
          variant: "destructive",
        });
        return;
      }
      setPermissionStatus(Notification.permission);
    }
    
    const newPreferences = { ...preferences, browser: checked };
    setPreferences(newPreferences);
    setNotificationPreferences(newPreferences);
    
    toast({
      title: checked ? "Browser Notifications Enabled" : "Browser Notifications Disabled",
      description: checked 
        ? "You will now receive browser notifications for machine state changes and Total Current alerts" 
        : "You will no longer receive browser notifications",
    });
  };

  const handleEmailToggle = (checked: boolean) => {
    const newPreferences = { ...preferences, email: checked };
    setPreferences(newPreferences);
    setNotificationPreferences(newPreferences);
    
    if (checked && !userEmail) {
      toast({
        title: "Login Required",
        description: "You need to be logged in to receive email notifications. Please log in and try again.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: checked ? "Email Notifications Enabled" : "Email Notifications Disabled",
      description: checked 
        ? `You will now receive email notifications at ${userEmail}` 
        : "You will no longer receive email notifications",
    });
    
    // Trigger a test email if enabled
    if (checked && userEmail) {
      sendTestEmail();
    }
  };

  const sendTestEmail = async () => {
    if (!userEmail) {
      toast({
        title: "Login Required",
        description: "You need to be logged in to receive email notifications.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      toast({
        title: "Sending Test Email",
        description: "We're sending a test email to verify your notification settings.",
      });
      
      const { data, error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          email: userEmail,
          machineId: "TEST001",
          timestamp: new Date().toISOString(),
          alertType: 'TOTAL_CURRENT_THRESHOLD',
          totalCurrent: 20.0
        }
      });
      
      if (error) {
        throw error;
      }
      
      console.log("Test email response:", data);
      
      toast({
        title: "Test Email Sent",
        description: `A test email has been sent to ${userEmail}. Please check your inbox.`,
      });
    } catch (error) {
      console.error("Error sending test email:", error);
      toast({
        title: "Test Email Failed",
        description: "Failed to send test email. Please check console for details.",
        variant: "destructive",
      });
    }
  };

  const requestPermission = async () => {
    if (browserSupported) {
      const granted = await getBrowserNotificationPermission();
      setPermissionStatus(Notification.permission);
      
      if (granted) {
        toast({
          title: "Permission Granted",
          description: "You will now receive browser notifications for important events, including Total Current alerts.",
        });
        
        // Auto-enable browser notifications once permission is granted
        if (!preferences.browser) {
          const newPreferences = { ...preferences, browser: true };
          setPreferences(newPreferences);
          setNotificationPreferences(newPreferences);
        }
      } else {
        toast({
          title: "Permission Denied",
          description: "Browser notifications were denied. Please update your browser settings.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Card className="w-full max-w-md bg-dark-foreground/10 border-dark-foreground/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Bell className="mr-2 h-5 w-5 text-sage" />
          Notification Settings
        </CardTitle>
        <CardDescription className="text-gray-400">
          Configure how you want to be notified about machine state changes and Total Current alerts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!userEmail && (
          <Alert variant="destructive" className="bg-red-900/20 border-red-900/50 text-red-400">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Login Required</AlertTitle>
            <AlertDescription>
              You need to be logged in to receive email notifications. Please log in first.
            </AlertDescription>
          </Alert>
        )}
        
        {!browserSupported && (
          <Alert variant="destructive" className="bg-red-900/20 border-red-900/50 text-red-400">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Browser Limitation</AlertTitle>
            <AlertDescription>
              Your browser doesn't support notifications. Try using a modern browser like Chrome or Firefox.
            </AlertDescription>
          </Alert>
        )}
        
        {browserSupported && permissionStatus === 'denied' && (
          <Alert variant="destructive" className="bg-amber-900/20 border-amber-900/50 text-amber-400">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Notification Permission Blocked</AlertTitle>
            <AlertDescription>
              Notifications are blocked for this site. Please update your browser settings to enable notifications.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center space-x-2">
            <Bell className="h-4 w-4 text-gray-400" />
            <Label htmlFor="browser-notifications" className="text-white">Browser Notifications</Label>
          </div>
          <Switch
            id="browser-notifications"
            checked={preferences.browser}
            onCheckedChange={handleBrowserToggle}
            disabled={!browserSupported || permissionStatus === 'denied'}
            className="data-[state=checked]:bg-sage"
          />
        </div>
        
        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center space-x-2">
            <Mail className="h-4 w-4 text-gray-400" />
            <Label htmlFor="email-notifications" className="text-white">Email Notifications</Label>
          </div>
          <Switch
            id="email-notifications"
            checked={preferences.email}
            onCheckedChange={handleEmailToggle}
            disabled={!userEmail}
            className="data-[state=checked]:bg-sage"
          />
        </div>
        
        {userEmail && preferences.email && (
          <div className="mt-2 text-sm text-gray-400 pl-6">
            Notifications will be sent to: {userEmail}
          </div>
        )}
        
        <Alert className="bg-blue-900/20 border-blue-900/50 text-blue-400 mt-4">
          <Info className="h-4 w-4" />
          <AlertTitle>Email Notifications</AlertTitle>
          <AlertDescription>
            Both State Change and Total Current alerts (when current exceeds 15.00) will be sent to your email when enabled.
          </AlertDescription>
        </Alert>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        {browserSupported && permissionStatus !== 'granted' && (
          <Button onClick={requestPermission} className="bg-sage hover:bg-sage/90 text-white w-full">
            Request Notification Permission
          </Button>
        )}
        
        {userEmail && preferences.email && (
          <Button onClick={sendTestEmail} variant="outline" className="border-sage text-sage hover:bg-sage/20 w-full">
            Send Test Email
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default NotificationSettings;
