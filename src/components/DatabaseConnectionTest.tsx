
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { dbParams, testConnection } from '@/utils/dbConnection';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';

const DatabaseConnectionTest = () => {
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  const checkConnection = async () => {
    setConnectionStatus('testing');
    setErrorMessage(null);
    
    try {
      const result = await testConnection();
      
      if (result === true) {
        setConnectionStatus('success');
        toast({
          title: "Connection Successful",
          description: "Successfully connected to PostgreSQL database",
        });
      } else {
        setConnectionStatus('error');
        setErrorMessage(String(result));
        toast({
          title: "Connection Failed",
          description: "Failed to connect to PostgreSQL database",
          variant: "destructive"
        });
      }
    } catch (error) {
      setConnectionStatus('error');
      setErrorMessage(String(error));
      toast({
        title: "Connection Error",
        description: String(error),
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    // Optional: Test connection on component mount
    // checkConnection();
  }, []);

  return (
    <div className="p-6 bg-dark-foreground/10 rounded-lg space-y-4">
      <h2 className="text-2xl font-bold text-white">Database Connection</h2>
      
      <div className="bg-dark-foreground/5 p-4 rounded-md">
        <h3 className="text-lg font-semibold text-white mb-2">Connection Parameters</h3>
        <div className="grid grid-cols-2 gap-2 text-gray-300">
          <span className="font-medium">Host:</span>
          <span>{dbParams.host}</span>
          
          <span className="font-medium">Port:</span>
          <span>{dbParams.port}</span>
          
          <span className="font-medium">Database:</span>
          <span>{dbParams.dbname}</span>
          
          <span className="font-medium">User:</span>
          <span>{dbParams.user}</span>
          
          <span className="font-medium">Password:</span>
          <span>{'*'.repeat(8)}</span>
        </div>
      </div>
      
      {connectionStatus === 'success' && (
        <Alert className="bg-green-500/20 border-green-500/50">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertTitle className="text-green-400">Connection Successful</AlertTitle>
          <AlertDescription className="text-green-300">
            Successfully connected to the PostgreSQL database.
          </AlertDescription>
        </Alert>
      )}
      
      {connectionStatus === 'error' && (
        <Alert className="bg-red-500/20 border-red-500/50">
          <XCircle className="h-4 w-4 text-red-500" />
          <AlertTitle className="text-red-400">Connection Failed</AlertTitle>
          <AlertDescription className="text-red-300">
            {errorMessage || "Unknown error occurred while connecting to the database."}
          </AlertDescription>
        </Alert>
      )}
      
      <Button 
        onClick={checkConnection} 
        className="bg-sage hover:bg-sage/90 text-white"
        disabled={connectionStatus === 'testing'}
      >
        {connectionStatus === 'testing' ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Testing Connection...
          </>
        ) : (
          "Test Database Connection"
        )}
      </Button>
    </div>
  );
};

export default DatabaseConnectionTest;
