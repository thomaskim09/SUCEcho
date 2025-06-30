// src/lib/supabase-realtime.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        'Missing Supabase URL or Anon Key in client-side environment variables.'
    );
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const SUPABASE_CHANNEL_NAME =
    process.env.NEXT_PUBLIC_SUPABASE_CHANNEL_NAME || 'post_room';

export default supabase;
export { SUPABASE_CHANNEL_NAME };
