// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = "https://dyslbgemyefpuxevjofy.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5c2xiZ2VteWVmcHV4ZXZqb2Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA4Mjg1ODAsImV4cCI6MjA0NjQwNDU4MH0.8C3hXT86ApqckHKtXTy5jz8Z_NfRwaOAqssD_92djDU";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);