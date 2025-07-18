// src/app/api/admin/posts/create-special/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import supabase from '@/lib/supabase-realtime';
import { verifySession } from '@/lib/auth';
import logger from '@/lib/logger';
import { MAIN_CHANNEL } from '@/lib/supabase-realtime';

export async function POST(request: NextRequest) {
    // 1. Authenticate the admin
    const session = request.cookies.get('session')?.value;
    const adminUser = await verifySession(session || '');
    if (!adminUser) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { content, type, url } = body;

        // 2. Validate the input
        if (!content || !type) {
            return NextResponse.json(
                { error: 'Missing content or type' },
                { status: 400 }
            );
        }
        if (type === 'ADVERTISEMENT' && !url) {
            return NextResponse.json(
                {
                    error: 'URL is required for ADVERTISEMENT type',
                },
                { status: 400 }
            );
        }
        if (!['ANNOUNCEMENT', 'ADVERTISEMENT'].includes(type)) {
            return NextResponse.json(
                { error: 'Invalid post type' },
                { status: 400 }
            );
        }

        // 3. Create the post and its stats in a transaction
        const newPostWithStats = await prisma.$transaction(async (tx) => {
            const createdPost = await tx.post.create({
                data: {
                    content,
                    type,
                    url,
                    // Admin posts use a system fingerprint to distinguish them
                    fingerprintHash: 'system-admin-post',
                },
            });

            const createdStats = await tx.postStats.create({
                data: {
                    postId: createdPost.id,
                    upvotes: 0,
                    downvotes: 0,
                    replyCount: 0,
                    hotnessScore: 0,
                },
            });

            // Return the full post object with stats included
            return { ...createdPost, stats: createdStats };
        });

        // 4. Broadcast the new post to all clients
        const channel = supabase.channel(MAIN_CHANNEL);
        await channel.send({
            type: 'broadcast',
            event: 'new_post',
            payload: newPostWithStats,
        });

        return NextResponse.json(newPostWithStats, { status: 201 });
    } catch (error) {
        logger.error('Error creating special post:', error);
        return NextResponse.json(
            { error: 'Failed to create special post' },
            { status: 500 }
        );
    }
}
