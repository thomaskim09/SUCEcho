// sucecho/src/app/api/admin/realtime-stats/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import logger from '@/lib/logger';
import { verifySession } from '@/lib/auth';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase environment variables for admin stats.');
}

// This admin client uses the service role key
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

export async function GET(request: Request) {
    const session = request.headers
        .get('cookie')
        ?.match(/session=([^;]+)/)?.[1];
    const adminUser = await verifySession(session || '');
    if (!adminUser) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        // This RPC call will now succeed because of the new function definition
        const { data, error } = await supabaseAdmin.rpc(
            'get_channel_connection_count',
            {
                channel_name: 'posts',
            }
        );

        if (error) {
            throw new Error(`Supabase RPC error: ${error.message}`);
        }

        logger.log(`Fetched realtime connection count via RPC: ${data}`);

        return NextResponse.json({
            connectionCount: data,
        });
    } catch (error) {
        logger.error('Error fetching realtime stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch realtime stats' },
            { status: 500 }
        );
    }
}
