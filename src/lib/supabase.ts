
import { supabase } from '@/integrations/supabase/client';

export { supabase };

// Enable real-time channel
const enableRealtime = async () => {
  try {
    // Enable RLS tables to be sent over the realtime system
    await supabase.rpc('supabase_realtime', { table: 'liveData' });
    console.log('Realtime enabled for liveData table');
  } catch (error) {
    console.error('Error enabling realtime:', error);
  }
};

// Call the function to enable real-time
enableRealtime();

console.log('Supabase client imported from integrations/supabase/client');
