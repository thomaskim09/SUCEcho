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
        const urlObj = new URL(url);
        const domain = urlObj.hostname.replace(/^www\./, '');
        const path = urlObj.pathname.length > 20 ? urlObj.pathname.substring(0, 17) + '...' : urlObj.pathname;
        // Display domain and path, but avoid showing just "/" for root domains
        displayUrl = path === '/' ? domain : `${domain}${path}`;

        // Set button label based on domain
        if (domain.includes('forms.gle') || domain.includes('google.com/forms')) {
            buttonLabel = '查看表单';
        } else if (domain.includes('youtube.com') || domain.includes('youtu.be')) {
            buttonLabel = '观看视频';
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
