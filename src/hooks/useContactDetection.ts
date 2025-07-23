import { useMemo } from 'react';

export interface ContactInfo {
    type:
        | 'mobile'
        | 'landline'
        | 'email'
        | 'instagram'
        | 'facebook'
        | 'telegram'
        | 'wechat';
    value: string;
    display: string;
}

const formatPhoneNumber = (
    phone: string,
    type: 'mobile' | 'landline'
): string => {
    let cleaned = phone.replace(/[- ]/g, ''); // Also remove spaces
    if (cleaned.startsWith('60')) {
        cleaned = '0' + cleaned.substring(2);
    }

    if (type === 'mobile') {
        // Format: 01X-XXX XXXX or 01X-XXXX XXXX
        if (cleaned.length === 10) {
            // e.g. 0123456789
            return `${cleaned.substring(0, 3)}-${cleaned.substring(
                3,
                6
            )} ${cleaned.substring(6)}`;
        }
        if (cleaned.length === 11) {
            // e.g. 01123456789
            return `${cleaned.substring(0, 3)}-${cleaned.substring(
                3,
                7
            )} ${cleaned.substring(7)}`;
        }
    } else {
        // landline
        // Format: 0X-XXX XXXX or 03-XXXX XXXX
        if (cleaned.length === 9) {
            // e.g., 072993943
            return `${cleaned.substring(0, 2)}-${cleaned.substring(
                2,
                5
            )} ${cleaned.substring(5)}`;
        }
        if (cleaned.length === 10 && cleaned.startsWith('03')) {
            // e.g., 0312345678
            return `${cleaned.substring(0, 2)}-${cleaned.substring(
                2,
                6
            )} ${cleaned.substring(6)}`;
        }
        if (cleaned.length === 10) {
            // e.g., 0821234567
            return `${cleaned.substring(0, 3)}-${cleaned.substring(
                3,
                6
            )} ${cleaned.substring(6)}`;
        }
    }
    return phone; // fallback to original if format is unexpected
};

const useContactDetection = (text: string): ContactInfo[] => {
    const contacts = useMemo(() => {
        const allContacts: ContactInfo[] = [];
        if (!text) return allContacts;

        const phoneRegex =
            /(?:6?01[0-9]\s?-?\s?[0-9]{7,8})|(?:0[3-9]\s?-?\s?[0-9]{7,8})/g;
        const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;
        const socialRegex = /(IG|FB|TG|WC)@([a-zA-Z0-9_.-]+)/gi;

        let match;

        // Find phones
        while ((match = phoneRegex.exec(text)) !== null) {
            const phoneStr = match[0];
            const cleaned = phoneStr.replace(/[- ]/g, '');
            const isMobile =
                phoneStr.replace(/[- ]/g, '').startsWith('01') ||
                phoneStr.replace(/[- ]/g, '').startsWith('601');
            const type = isMobile ? 'mobile' : 'landline';
            allContacts.push({
                type,
                value: cleaned,
                display: formatPhoneNumber(phoneStr, type),
            });
        }

        // Find emails
        while ((match = emailRegex.exec(text)) !== null) {
            allContacts.push({
                type: 'email',
                value: match[0],
                display: match[0],
            });
        }

        // Find social media
        while ((match = socialRegex.exec(text)) !== null) {
            let platform: ContactInfo['type'] | null = null;
            switch (match[1].toLowerCase()) {
                case 'ig':
                    platform = 'instagram';
                    break;
                case 'fb':
                    platform = 'facebook';
                    break;
                case 'tg':
                    platform = 'telegram';
                    break;
                case 'wc':
                    platform = 'wechat';
                    break;
            }
            if (platform) {
                allContacts.push({
                    type: platform,
                    value: match[2],
                    display: `@${match[2]}`,
                });
            }
        }

        // Remove duplicates
        return allContacts.filter(
            (contact, index, self) =>
                index ===
                self.findIndex(
                    (c) => c.type === contact.type && c.value === contact.value
                )
        );
    }, [text]);

    return contacts;
};

export default useContactDetection;
