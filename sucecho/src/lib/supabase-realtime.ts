// sucecho/src/lib/supabase-realtime.ts
import { createClient } from '@supabase/supabase-js';
import logger from './logger';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase environment variables');
}

// Create a single, shared Supabase client for the server-side
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: false,
    },
});

logger.log('Supabase Realtime client initialized for server-side usage.');

export default supabase;
