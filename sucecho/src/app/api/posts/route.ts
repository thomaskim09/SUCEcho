// sucecho/src/app/api/posts/route.ts
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import eventEmitter from '@/lib/event-emitter';
import { generateCodename } from '@/lib/codename';
import logger from '@/lib/logger';
import { findBestMatch } from 'string-similarity';

// Rate Limiting Cache
const postCooldown = new Map<string, number>();
const commentCooldown = new Map<string, number>();
const replyCooldown = new Map<string, Map<number, number>>();
const replyCounts = new Map<string, Map<number, number>>();

const whitelistedDomains = (process.env.WHITELISTED_DOMAINS || '').split(',');
const urlRegex = /(https?:\/\/[^\s]+)/g;

/**
 * Handles GET requests to fetch the main feed of posts with pagination.
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '10', 10);
        const cursor = searchParams.get('cursor');

        const posts = await prisma.post.findMany({
            take: limit,
            ...(cursor && {
                skip: 1, // Skip the cursor itself
                cursor: {
                    id: parseInt(cursor, 10),
                },
            }),
            where: {
                content: { not: null },
                parentPostId: null,
            },
            select: {
                id: true,
                content: true,
                createdAt: true,
                parentPostId: true,
                fingerprintHash: true,
                stats: {
                    select: {
                        upvotes: true,
                        downvotes: true,
                        replyCount: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        let nextCursor: number | null = null;
        if (posts.length === limit) {
            nextCursor = posts[posts.length - 1].id;
        }

        return NextResponse.json({
            posts,
            nextCursor,
        });
    } catch (error) {
        logger.error('Error fetching posts:', error);
        return NextResponse.json({ error: '获取回音失败' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { content, fingerprintHash, parentPostId } = body;

        if (!content || !fingerprintHash) {
            return NextResponse.json(
                { error: '缺少内容或指纹信息' },
                { status: 400 }
            );
        }
        if (content.length > 400) {
            return NextResponse.json(
                { error: '内容超过400个字符' },
                { status: 400 }
            );
        }

        const urls = content.match(urlRegex);
        if (urls) {
            for (const urlStr of urls) {
                try {
                    const url = new URL(urlStr);
                    const domain = url.hostname.replace(/^www\./, '');
                    if (!whitelistedDomains.includes(domain)) {
                        return NextResponse.json(
                            {
                                error: `链接 ${url.hostname} 不在允许的域名列表中。`,
                            },
                            { status: 400 }
                        );
                    }
                } catch {
                    // Ignore invalid URLs
                }
            }
        }

        const now = Date.now();
        const postCooldownTime =
            parseInt(process.env.POST_COOLDOWN_MINUTES || '5') * 60 * 1000;
        const commentCooldownTime =
            parseInt(process.env.COMMENT_COOLDOWN_SECONDS || '60') * 1000;
        const replyCooldownTime =
            parseInt(process.env.REPLY_COOLDOWN_MINUTES || '10') * 60 * 1000;
        const replyLimit = parseInt(process.env.REPLY_LIMIT_PER_POST || '5');

        if (parentPostId) {
            // Comment Rate Limiting
            const userCommentCooldown = commentCooldown.get(fingerprintHash);
            if (userCommentCooldown && now < userCommentCooldown) {
                const timeLeft = Math.ceil((userCommentCooldown - now) / 1000);
                return NextResponse.json(
                    {
                        error: `你的想法太快了，请等待 ${timeLeft} 秒后再回应。`,
                    },
                    { status: 429 }
                );
            }

            // Reply Cooldown
            const userReplyCooldowns = replyCooldown.get(fingerprintHash);
            if (
                userReplyCooldowns &&
                userReplyCooldowns.has(parentPostId) &&
                now < userReplyCooldowns.get(parentPostId)!
            ) {
                const timeLeft = Math.ceil(
                    (userReplyCooldowns.get(parentPostId)! - now) / 1000 / 60
                );
                return NextResponse.json(
                    {
                        error: `你刚刚回应过这个回音，休息一下，${timeLeft} 分钟后再来吧。`,
                    },
                    { status: 429 }
                );
            }

            // Reply Limit
            const userReplyCounts = replyCounts.get(fingerprintHash);
            if (
                userReplyCounts &&
                (userReplyCounts.get(parentPostId) || 0) >= replyLimit
            ) {
                return NextResponse.json(
                    { error: '你对这个回音的回应次数已达上限。' },
                    { status: 429 }
                );
            }
        } else {
            // Post Rate Limiting
            const userPostCooldown = postCooldown.get(fingerprintHash);
            if (userPostCooldown && now < userPostCooldown) {
                const timeLeft = Math.ceil(
                    (userPostCooldown - now) / 1000 / 60
                );
                return NextResponse.json(
                    {
                        error: `你的想法太快了，请等待 ${timeLeft} 分钟后再发布。`,
                    },
                    { status: 429 }
                );
            }

            // Content Similarity Check
            if (process.env.SIMILARITY_CHECK_ENABLED === 'true') {
                const similarityThreshold = parseFloat(
                    process.env.SIMILARITY_THRESHOLD || '0.85'
                );
                const checkHours = parseInt(
                    process.env.SIMILARITY_CHECK_HOURS || '1'
                );
                const recentPosts = await prisma.post.findMany({
                    where: {
                        createdAt: {
                            gte: new Date(now - checkHours * 60 * 60 * 1000),
                        },
                        parentPostId: null,
                    },
                    select: { content: true },
                });

                if (recentPosts.length > 0) {
                    const contents = recentPosts
                        .map((p) => p.content)
                        .filter((c): c is string => c !== null);
                    const { bestMatch } = findBestMatch(content, contents);
                    if (bestMatch && bestMatch.rating > similarityThreshold) {
                        return NextResponse.json(
                            {
                                error: '这个想法很棒，但似乎有人捷足先登了，换个说法试试？',
                            },
                            { status: 400 }
                        );
                    }
                }
            }
        }

        const userProfile = await prisma.userAnonymizedProfile.findUnique({
            where: { fingerprintHash },
        });

        if (userProfile?.isBanned) {
            const expires = userProfile.banExpiresAt;
            if (!expires || new Date(expires) > new Date()) {
                const banLog = await prisma.adminLog.findFirst({
                    where: {
                        targetFingerprintHash: fingerprintHash,
                        action: 'BAN',
                    },
                    orderBy: { createdAt: 'desc' },
                });
                let message = `你已被封禁。`;
                if (expires)
                    message += ` 你的封禁将在 ${new Date(
                        expires
                    ).toLocaleString()} 解除。`;
                else message += ` 此次封禁是永久的。`;
                if (banLog?.reason) message += ` 原因: ${banLog.reason}`;
                return NextResponse.json({ error: message }, { status: 403 });
            }
        }

        const newPostWithStats = await prisma.$transaction(async (tx) => {
            await tx.userAnonymizedProfile.upsert({
                where: { fingerprintHash },
                update: { lastSeenAt: new Date() },
                create: {
                    fingerprintHash,
                    codename: generateCodename(fingerprintHash),
                    lastSeenAt: new Date(),
                },
            });

            const createdPost = await tx.post.create({
                data: {
                    content,
                    fingerprintHash,
                    parentPostId: parentPostId ? Number(parentPostId) : null,
                },
            });

            if (parentPostId) {
                await tx.postStats.upsert({
                    where: { postId: Number(parentPostId) },
                    update: { replyCount: { increment: 1 } },
                    create: { postId: Number(parentPostId), replyCount: 1 },
                });
            }

            const createdStats = await tx.postStats.create({
                data: {
                    postId: createdPost.id,
                    upvotes: 0,
                    downvotes: 0,
                    replyCount: 0,
                    hotnessScore: 0,
                },
            });

            return { ...createdPost, stats: createdStats };
        });

        // Update Rate Limiting Maps
        if (parentPostId) {
            commentCooldown.set(fingerprintHash, now + commentCooldownTime);

            let userReplyCooldowns = replyCooldown.get(fingerprintHash);
            if (!userReplyCooldowns) {
                userReplyCooldowns = new Map();
                replyCooldown.set(fingerprintHash, userReplyCooldowns);
            }
            userReplyCooldowns.set(parentPostId, now + replyCooldownTime);

            let userReplyCounts = replyCounts.get(fingerprintHash);
            if (!userReplyCounts) {
                userReplyCounts = new Map();
                replyCounts.set(fingerprintHash, userReplyCounts);
            }
            userReplyCounts.set(
                parentPostId,
                (userReplyCounts.get(parentPostId) || 0) + 1
            );
        } else {
            postCooldown.set(fingerprintHash, now + postCooldownTime);
        }

        eventEmitter.emit('new_post', newPostWithStats);

        if (newPostWithStats.parentPostId) {
            const parentStats = await prisma.postStats.findUnique({
                where: { postId: newPostWithStats.parentPostId },
            });
            if (parentStats) {
                eventEmitter.emit('update_vote', {
                    postId: newPostWithStats.parentPostId,
                    stats: parentStats,
                });
            }
        }

        return NextResponse.json(newPostWithStats, { status: 201 });
    } catch (error: unknown) {
        logger.error('Error creating post:', error);
        if ((error as { code?: string }).code === 'P2025') {
            return NextResponse.json(
                { error: '你回应的回音似乎已经消失了。' },
                { status: 404 }
            );
        }
        return NextResponse.json({ error: '发布回音失败' }, { status: 500 });
    }
}
