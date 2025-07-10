// src/app/api/posts/route.ts
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import supabase, {
    MAIN_CHANNEL,
    getPostRoomChannelName,
} from '@/lib/supabase-realtime';
import { generateCodename } from '@/lib/codename';
import logger from '@/lib/logger';
import { findBestMatch } from 'string-similarity';

const postCooldown = new Map<string, number>();
const commentCooldown = new Map<string, number>();
const replyCooldown = new Map<string, Map<number, number>>();
const replyCounts = new Map<string, Map<number, number>>();

const whitelistedDomains = (process.env.WHITELISTED_DOMAINS || '').split(',');
const urlRegex = /(https?:\/\/[^\s]+)/g;

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '10', 10);
        const cursor = searchParams.get('cursor');

        const posts = await prisma.post.findMany({
            take: limit,
            ...(cursor && {
                skip: 1,
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
                type: true,
                advertisementUrl: true,
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
        let {
            content,
            fingerprintHash,
            parentPostId,
            parentReplyId,
            type,
            pollOptions,
        } = body;

        if (content && typeof content === 'string') {
            content = content.trim();
            content = content.replace(/\n{3,}/g, '\n\n');
        }

        if (!content || !fingerprintHash) {
            return NextResponse.json(
                { error: '缺少内容或指纹信息' },
                { status: 400 }
            );
        }

        const postCharLimit = parseInt(
            process.env.NEXT_PUBLIC_POST_CHAR_LIMIT || '400'
        );
        if (content.length > postCharLimit) {
            return NextResponse.json(
                { error: `内容超过${postCharLimit}个字符` },
                { status: 400 }
            );
        }

        if (type === 'POLL') {
            if (
                !Array.isArray(pollOptions) ||
                pollOptions.length < 2 ||
                pollOptions.length > 5
            ) {
                return NextResponse.json(
                    { error: '投票必须包含2到5个选项。' },
                    { status: 400 }
                );
            }
            if (
                pollOptions.some(
                    (opt: any) =>
                        typeof opt !== 'string' ||
                        opt.trim().length === 0 ||
                        opt.length > 50
                )
            ) {
                return NextResponse.json(
                    { error: '投票选项无效或过长。' },
                    { status: 400 }
                );
            }
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
        }

        const newPostWithRelations = await prisma.$transaction(async (tx) => {
            const userProfile = await tx.userAnonymizedProfile.upsert({
                where: { fingerprintHash },
                update: { lastSeenAt: new Date() },
                create: {
                    fingerprintHash,
                    codename: generateCodename(fingerprintHash),
                    lastSeenAt: new Date(),
                },
            });

            if (userProfile.isBanned) {
                const expires = userProfile.banExpiresAt;
                if (!expires || new Date(expires) > new Date()) {
                    throw new Error('BANNED');
                }
            }

            if (
                process.env.SIMILARITY_CHECK_ENABLED === 'true' &&
                !parentPostId
            ) {
                const similarityThreshold = parseFloat(
                    process.env.SIMILARITY_THRESHOLD || '0.85'
                );
                const checkHours = parseInt(
                    process.env.SIMILARITY_CHECK_HOURS || '1'
                );
                const recentPosts = await tx.post.findMany({
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
                        throw new Error('SIMILAR');
                    }
                }
            }

            const createdPost = await tx.post.create({
                data: {
                    content,
                    fingerprintHash,
                    parentPostId: parentPostId ? Number(parentPostId) : null,
                    parentReplyId: parentReplyId ? Number(parentReplyId) : null,
                    type: type || 'DEFAULT',
                },
            });

            if (type === 'POLL' && pollOptions) {
                await tx.pollOption.createMany({
                    data: pollOptions.map((optionText: string) => ({
                        text: optionText,
                        postId: createdPost.id,
                    })),
                });
            }

            if (parentPostId) {
                await tx.postStats.upsert({
                    where: { postId: Number(parentPostId) },
                    update: { replyCount: { increment: 1 } },
                    create: { postId: Number(parentPostId), replyCount: 1 },
                });
            }

            await tx.postStats.create({
                data: {
                    postId: createdPost.id,
                    upvotes: 0,
                    downvotes: 0,
                    replyCount: 0,
                    hotnessScore: 0,
                },
            });

            // Refetch to include relations
            const finalPost = await tx.post.findUnique({
                where: { id: createdPost.id },
                include: {
                    stats: true,
                    pollOptions: type === 'POLL',
                },
            });

            return finalPost;
        });

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

        const isGranularEnabled =
            process.env.NEXT_PUBLIC_GRANULAR_REALTIME_ENABLED === 'true';
        const areRepliesEnabled =
            process.env.REALTIME_REPLIES_ENABLED === 'true';

        let channelName: string | null = null;

        if (parentPostId) {
            if (areRepliesEnabled) {
                channelName = isGranularEnabled
                    ? getPostRoomChannelName(parentPostId)
                    : MAIN_CHANNEL;
            }
        } else {
            channelName = MAIN_CHANNEL;
        }

        if (channelName) {
            const channel = supabase.channel(channelName);
            channel
                .send({
                    type: 'broadcast',
                    event: 'new_post',
                    payload: newPostWithRelations,
                })
                .then(() => {
                    supabase.removeChannel(channel);
                });
        }

        return NextResponse.json(newPostWithRelations, { status: 201 });
    } catch (error: unknown) {
        if (error instanceof Error) {
            if (error.message === 'BANNED') {
                return NextResponse.json(
                    { error: '你已被封禁，无法发布内容。' },
                    { status: 403 }
                );
            }
            if (error.message === 'SIMILAR') {
                return NextResponse.json(
                    {
                        error: '这个想法很棒，但似乎有人捷足先登了，换个说法试试？',
                    },
                    { status: 400 }
                );
            }
        }

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
