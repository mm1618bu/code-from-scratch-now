
// Import the supabase client correctly
import { supabase } from '@/integrations/supabase/client';

export { supabase };

// NO real-time subscription in this file
// We don't want any automatic refreshes

console.log('Supabase client imported - NO auto-refresh');
