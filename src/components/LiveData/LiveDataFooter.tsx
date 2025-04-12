
import React from 'react';
import { User } from '@supabase/supabase-js';

interface LiveDataFooterProps {
  user: User;
}

const LiveDataFooter: React.FC<LiveDataFooterProps> = ({ user }) => {
  return (
    <div className="p-4 bg-dark-foreground/10 rounded-lg mt-6">
      <p className="text-gray-400">Current user: {user.email}</p>
    </div>
  );
};

export default LiveDataFooter;
