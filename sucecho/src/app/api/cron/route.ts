    // sucecho/src/app/api/cron/route.ts
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // 1. Authenticate the request
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 2. Find posts older than 24 hours that still have content
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const postsToNullify = await prisma.post.findMany({
      where: {
        createdAt: {
          lt: twentyFourHoursAgo, // 'lt' means "less than"
        },
        content: {
          not: null, // Only find posts that haven't been nullified yet
        },
      },
      select: {
        id: true, // We only need the IDs
      },
    });

    if (postsToNullify.length === 0) {
      console.log('CRON: No posts needed to be nullified.');
      return NextResponse.json({ message: 'No posts to nullify.' });
    }

    const postIdsToNullify = postsToNullify.map(p => p.id);

    // 3. Update the found posts to set their content to null
    const result = await prisma.post.updateMany({
      where: {
        id: {
          in: postIdsToNullify,
        },
      },
      data: {
        content: null, // This is the "destruction"
      },
    });

    console.log(`CRON: Successfully nullified content for ${result.count} posts.`);

    // Note: We are not broadcasting this via SSE yet, as per the plan.
    // The "化为尘埃" (pixel dust) animation is a future client-side enhancement.

    return NextResponse.json({
      message: 'Cron job completed successfully.',
      nullifiedCount: result.count,
    });

  } catch (error) {
    console.error('CRON ERROR:', error);
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
  }
}