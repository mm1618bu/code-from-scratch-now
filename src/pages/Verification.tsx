
import React from 'react';
import { Link } from "react-router-dom";
import SageLogo from '@/components/SageLogo';
import { Button } from "@/components/ui/button";
import { Ban } from "lucide-react";

const Verification: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark flex flex-col items-center">
      {/* Header with logo */}
      <header className="w-full p-4 flex justify-between items-center">
        <SageLogo />
        <button className="text-white p-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" x2="20" y1="12" y2="12"/>
            <line x1="4" x2="20" y1="6" y2="6"/>
            <line x1="4" x2="20" y1="18" y2="18"/>
          </svg>
        </button>
      </header>

      {/* Main content */}
      <div className="flex-grow flex flex-col justify-center items-center px-6 text-center">
        <div className="bg-dark-foreground/10 p-6 rounded-full mb-4">
          <Ban size={48} className="text-gray-400" />
        </div>
        <h1 className="text-white text-xl font-medium mb-2">Verification Required</h1>
        <p className="text-gray-400 mb-8">
          To continue using Sage, we will need to verify your Account.
        </p>
      </div>

      {/* Footer */}
      <footer className="w-full p-6 mt-auto text-center">
        <p className="text-gray-400 text-sm mb-2">Think you're seeing this by mistake?</p>
        <div className="flex justify-center space-x-4 text-sm">
          <Link to="#" className="text-sage hover:underline">Support</Link>
          <span className="text-gray-600">•</span>
          <Link to="/" className="text-sage hover:underline">Logout</Link>
        </div>
      </footer>
    </div>
  );
};

export default Verification;
