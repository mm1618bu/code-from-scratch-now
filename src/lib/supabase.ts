
import { createClient } from '@supabase/supabase-js';

// Use the Supabase URL and anon key from the integration/client.ts file
const supabaseUrl = "https://wslknedjckwxcnadmzvj.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzbGtuZWRqY2t3eGNuYWRtenZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzMzA2MjksImV4cCI6MjA1OTkwNjYyOX0.P4o44salydFoCRqyPGVia5MMPYDvWj_ZO5eC6NffqbI";

// Create and export the Supabase client with explicit configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

console.log('Supabase client initialized');
