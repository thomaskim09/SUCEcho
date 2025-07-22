// src/app/components/LinkPreviewCard.tsx
"use client";

import { motion } from 'framer-motion';
import { Icon } from './Icon';

interface LinkPreviewCardProps {
    url: string | null | undefined;
}

const LinkPreviewCard = ({ url }: LinkPreviewCardProps) => {
    if (!url) {
        return null;
    }

    let displayUrl = '';
    let buttonLabel = '打开链接';

    try {
        if (url.startsWith('mailto:')) {
            displayUrl = url;
            buttonLabel = '发送邮件';
        } else {
            const urlObj = new URL(url);
            const domain = urlObj.hostname.replace(/^www\./, '');
            const path = urlObj.pathname.length > 20 ? urlObj.pathname.substring(0, 17) + '...' : urlObj.pathname;
            displayUrl = path === '/' ? domain : `${domain}${path}`;

            // Set button label based on domain
            if (domain.includes('forms.gle') || domain.includes('google.com/forms')) {
                buttonLabel = '查看表单';
            } else if (domain.includes('youtube.com') || domain.includes('youtu.be')) {
                buttonLabel = '观看视频';
            } else if (domain.includes('spotify.com')) {
                buttonLabel = '收听音乐';
            } else if (['instagram.com', 'tiktok.com', 'x.com', 'twitter.com', 'xiaohongshu.com', 'xhslink.com'].some(d => domain.includes(d))) {
                buttonLabel = '查看帖子';
            } else if (['wa.me', 'whatsapp.com'].some(d => domain.includes(d))) {
                buttonLabel = '打开聊天';
            } else if (['linkedin.com', 'jobstreet.com', 'indeed.com', 'glints.com'].some(d => domain.includes(d))) {
                buttonLabel = '查看职位';
            } else if (['behance.net', 'dribbble.com', 'github.com', 'gitlab.com', 'canva.com'].some(d => domain.includes(d))) {
                buttonLabel = '查看作品';
            } else if (['docs.google.com', 'drive.google.com', 'onedrive.live.com', '1drv.ms', 'notion.so'].some(d => domain.includes(d))) {
                buttonLabel = '查看文件';
            }
        }
    } catch {
        displayUrl = '无效的链接';
        buttonLabel = '链接无效';
    }


    const handleCardClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="glass-card p-3 rounded-lg"
        >
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleCardClick}
                className="flex items-center justify-between gap-4 w-full"
            >
                <Icon name="share" className="w-6 h-6 text-accent flex-shrink-0" />

                <p className="text-white text-sm font-mono break-all flex-grow min-w-0">
                    {displayUrl}
                </p>

                <div className="bg-accent text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity text-sm flex-shrink-0">
                    {buttonLabel}
                </div>
            </a>
        </motion.div>
    );
};

export default LinkPreviewCard;