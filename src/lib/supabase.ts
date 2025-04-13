
// Import the supabase client correctly
import { supabase } from '@/integrations/supabase/client';

export { supabase };

// IMPORTANT: NO automatic data refreshing
// NO real-time subscription set up in this file
// All real-time subscriptions are handled explicitly in components
// and are configured to NEVER trigger data refreshes

console.log('Supabase client imported - NO automatic data refreshing enabled');
