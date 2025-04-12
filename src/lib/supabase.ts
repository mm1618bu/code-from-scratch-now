
// Import the supabase client correctly
import { supabase } from '@/integrations/supabase/client';

export { supabase };

// Enable real-time channel
const enableRealtime = async () => {
  try {
    // Add logging to verify realtime setup
    console.log('Setting up realtime subscription for liveData table...');
    
    // Configure the realtime channel with more specific options
    const channel = supabase.channel('public:liveData')
      .on('postgres_changes', { 
        event: '*',  // Listen for all events
        schema: 'public', 
        table: 'liveData' 
      }, payload => {
        console.log('Realtime change received:', payload);
      })
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });
    
    console.log('Realtime enabled for liveData table with channel:', channel);
  } catch (error) {
    console.error('Error enabling realtime:', error);
  }
};

// Call the function to enable real-time
enableRealtime();

console.log('Supabase client imported and realtime enabled');
