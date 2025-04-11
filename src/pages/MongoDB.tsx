
import React from 'react';
import SageLogo from '@/components/SageLogo';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Database } from 'lucide-react';
import MongoDBInfo from '@/components/MongoDBInfo';
import MongoDBEditor from '@/components/MongoDBEditor';

const MongoDB: React.FC = () => {
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

      <div className="flex-grow w-full max-w-4xl p-6">
        <h1 className="text-white text-2xl font-bold mb-6">MongoDB Integration</h1>
        
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div></div>
            <Button 
              onClick={() => navigate('/live-data')}
              className="bg-sage hover:bg-sage/90 mb-4"
            >
              <Database className="h-4 w-4 mr-2" />
              View Live Data Table
            </Button>
          </div>
          
          <MongoDBEditor />
          
          <div className="bg-dark-foreground/10 p-6 rounded-lg">
            <MongoDBInfo />
          </div>
          
          {user && (
            <div className="p-4 bg-dark-foreground/10 rounded-lg">
              <h2 className="text-white text-xl font-bold mb-4">User Information</h2>
              <p className="text-gray-400">Current user: {user.email}</p>
            </div>
          )}
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

export default MongoDB;
