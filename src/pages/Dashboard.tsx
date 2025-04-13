
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import SageLogo from '@/components/SageLogo';
import { Button } from '@/components/ui/button';
import { LogOut, User, Database } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-dark flex flex-col items-center">
      <header className="w-full p-4 flex justify-between items-center">
        <SageLogo />
        <Button 
          variant="ghost" 
          className="text-white hover:bg-dark-foreground/20"
          onClick={() => signOut()}
        >
          <LogOut className="h-5 w-5 mr-2" />
          Logout
        </Button>
      </header>

      <div className="flex-grow flex flex-col justify-center items-center px-6 text-center">
        <div className="bg-dark-foreground/10 p-6 rounded-full mb-4">
          <User size={48} className="text-sage" />
        </div>
        <h1 className="text-white text-xl font-medium mb-2">Welcome to your Dashboard</h1>
        <p className="text-gray-400 mb-8">
          {user?.email}
        </p>
        <div className="bg-dark-foreground/10 p-6 rounded-lg max-w-md w-full mb-6">
          <h2 className="text-white text-lg font-medium mb-3">Your Account</h2>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Email:</span>
              <span className="text-white">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">ID:</span>
              <span className="text-white">{user?.id.substring(0, 8)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Last Sign In:</span>
              <span className="text-white">
                {user?.last_sign_in_at 
                  ? new Date(user.last_sign_in_at).toLocaleString() 
                  : 'Never'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="w-full max-w-md">
          <Link to="/mongodb">
            <Button className="w-full bg-sage hover:bg-sage/90 flex items-center gap-2">
              <Database size={18} />
              View Live Data
            </Button>
          </Link>
        </div>
      </div>

      <footer className="w-full p-6 mt-auto text-center">
        <p className="text-gray-400 text-sm">
          Need help? <a href="#" className="text-sage hover:underline">Contact Support</a>
        </p>
      </footer>
    </div>
  );
};

export default Dashboard;
