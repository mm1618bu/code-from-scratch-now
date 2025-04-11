
import React from 'react';
import SageLogo from '@/components/SageLogo';
import LoginForm from '@/components/LoginForm';
import Footer from '@/components/Footer';

const Index: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md flex flex-col items-center">
        <SageLogo />
        
        <div className="w-full">
          <LoginForm />
        </div>
        
        <Footer />
      </div>
    </div>
  );
};

export default Index;
