
import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="text-center text-xs text-gray-500 mt-8">
      Copyright © {currentYear} Sage Enterprises Inc. All rights reserved.
    </footer>
  );
};

export default Footer;
