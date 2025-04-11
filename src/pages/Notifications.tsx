
import React from 'react';
import SageLogo from '@/components/SageLogo';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Bell } from 'lucide-react';
import NotificationSettings from '@/components/NotificationSettings';
import StateChangeSimulator from '@/components/StateChangeSimulator';

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-dark flex flex-col items-center">
      <header className="w-full p-4 flex justify-between items-center">
        <SageLogo />
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            className="text-white hover:bg-dark-foreground/20"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <div className="flex-grow w-full max-w-5xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Bell className="h-5 w-5 mr-2 text-sage" />
            <h1 className="text-white text-2xl font-bold">Notifications</h1>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <NotificationSettings />
          </div>
          <div>
            <StateChangeSimulator />
          </div>
          
          <div className="md:col-span-2 bg-dark-foreground/10 p-6 rounded-lg mt-4">
            <h2 className="text-white text-lg font-medium mb-4">About Notifications</h2>
            <p className="text-gray-300 mb-2">
              This system allows you to receive notifications when machine states change:
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-1 ml-4">
              <li>Browser notifications appear directly on your desktop</li>
              <li>Email notifications are sent to your registered email address</li>
              <li>Critical state changes (like errors) are highlighted for immediate attention</li>
            </ul>
            <p className="text-gray-300 mt-4">
              Use the simulator above to test how notifications work without affecting actual machines.
            </p>
          </div>
        </div>

        {user && (
          <div className="p-4 bg-dark-foreground/10 rounded-lg mt-6">
            <p className="text-gray-400">Current user: {user.email}</p>
          </div>
        )}
      </div>

      <footer className="w-full p-6 mt-auto text-center">
        <p className="text-gray-400 text-sm">
          Need help? <a href="#" className="text-sage hover:underline">Contact Support</a>
        </p>
      </footer>
    </div>
  );
};

export default Notifications;
