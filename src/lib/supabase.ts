
import { supabase } from '@/integrations/supabase/client';

export { supabase };

// Enable real-time channel
const enableRealtime = async () => {
  try {
    // Enable the realtime subscription for the liveData table
    await supabase.channel('public:liveData')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'liveData' 
      }, payload => {
        console.log('Change received!', payload);
      })
      .subscribe();
    
    console.log('Realtime enabled for liveData table');
  } catch (error) {
    console.error('Error enabling realtime:', error);
  }
};

// Call the function to enable real-time
enableRealtime();

console.log('Supabase client imported from integrations/supabase/client');
