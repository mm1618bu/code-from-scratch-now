// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://wslknedjckwxcnadmzvj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzbGtuZWRqY2t3eGNuYWRtenZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzMzA2MjksImV4cCI6MjA1OTkwNjYyOX0.P4o44salydFoCRqyPGVia5MMPYDvWj_ZO5eC6NffqbI";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);