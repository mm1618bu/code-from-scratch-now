
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
import { Bell, BellOff, Mail, AlertCircle } from 'lucide-react';
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

const NotificationSettings: React.FC = () => {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState(getNotificationPreferences());
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'default'>('default');
  const [browserSupported, setBrowserSupported] = useState(false);

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
    
    checkNotificationSupport();
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
        ? "You will now receive browser notifications for machine state changes" 
        : "You will no longer receive browser notifications",
    });
  };

  const handleEmailToggle = (checked: boolean) => {
    const newPreferences = { ...preferences, email: checked };
    setPreferences(newPreferences);
    setNotificationPreferences(newPreferences);
    
    toast({
      title: checked ? "Email Notifications Enabled" : "Email Notifications Disabled",
      description: checked 
        ? "You will now receive email notifications for machine state changes" 
        : "You will no longer receive email notifications",
    });
  };

  const requestPermission = async () => {
    if (browserSupported) {
      const granted = await getBrowserNotificationPermission();
      setPermissionStatus(Notification.permission);
      
      if (granted) {
        toast({
          title: "Permission Granted",
          description: "You will now receive browser notifications for important events.",
        });
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
          Configure how you want to be notified about machine state changes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
            className="data-[state=checked]:bg-sage"
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {browserSupported && permissionStatus !== 'granted' && (
          <Button onClick={requestPermission} className="bg-sage hover:bg-sage/90 text-white">
            Request Notification Permission
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default NotificationSettings;
