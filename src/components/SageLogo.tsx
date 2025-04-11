
import React from 'react';

const SageLogo: React.FC = () => {
  return (
    <div className="flex flex-col items-center mb-14">
      <div className="text-white text-5xl font-light mb-2">
        {/* Stylized brackets with asterisk */}
        <span>( * )</span>
      </div>
      <div className="text-white text-2xl font-light">
        sage
      </div>
    </div>
  );
};

export default SageLogo;
