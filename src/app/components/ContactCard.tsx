"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon, IconProps } from './Icon';
import useContactDetection, { ContactInfo } from '@/hooks/useContactDetection';

interface ContactCardProps {
    content: string;
}

const getContactIcon = (type: ContactInfo['type']): IconProps['name'] => {
    switch (type) {
        case 'mobile': return 'phone';
        case 'landline': return 'phone-call';
        case 'email': return 'mail';
        case 'instagram': return 'instagram';
        case 'facebook': return 'facebook';
        case 'telegram': return 'send';
        case 'wechat': return 'wechat';
        default: return 'briefcase';
    }
};

const ContactRow = ({ contact }: { contact: ContactInfo }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [copyText, setCopyText] = useState('Copy');
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleCopy = () => {
        navigator.clipboard.writeText(contact.value);
        setCopyText('Copied!');
        setTimeout(() => setCopyText('Copy'), 2000);
        setIsMenuOpen(false);
    };

    const renderPrimaryAction = () => {
        const buttonContent = (
            <AnimatePresence mode="wait">
                <motion.span
                    key={copyText}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.2 }}
                >
                    {copyText}
                </motion.span>
            </AnimatePresence>
        );

        switch (contact.type) {
            case 'mobile':
                return <a href={`https://wa.me/${contact.value}`} target="_blank" rel="noopener noreferrer" className="bg-green-600 hover:bg-green-500 text-white font-bold py-1 px-3 rounded-lg text-sm press-animation whitespace-nowrap">WhatsApp</a>;
            case 'landline':
                return <a href={`tel:${contact.value}`} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-1 px-3 rounded-lg text-sm press-animation">Call</a>;
            case 'email':
                return <a href={`mailto:${contact.value}`} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-1 px-3 rounded-lg text-sm press-animation">Email</a>;
            default:
                return <button onClick={handleCopy} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-1 px-3 rounded-lg text-sm press-animation whitespace-nowrap w-[70px] text-center">{buttonContent}</button>;
        }
    };

    const renderSecondaryActions = () => {
        const actions = [];
        if (contact.type === 'mobile') {
            actions.push(<a key="call" href={`tel:${contact.value}`} className="flex items-center gap-2 w-full text-left p-2 rounded hover:bg-gray-700 press-animation"><Icon name="phone" className="w-4 h-4" /> Call</a>);
        }
        if (contact.type !== 'instagram' && contact.type !== 'facebook' && contact.type !== 'telegram' && contact.type !== 'wechat') {
            actions.push(<button key="copy" onClick={handleCopy} className="flex items-center gap-2 w-full text-left p-2 rounded hover:bg-gray-700 press-animation"><Icon name="copy" className="w-4 h-4" /> {copyText}</button>);
        }
        return actions;
    };

    const secondaryActions = renderSecondaryActions();

    return (
        <div
            className="flex items-center justify-between gap-4"
        >
            <div className="flex items-center gap-3 min-w-0">
                <Icon name={getContactIcon(contact.type)} className="w-6 h-6 text-accent flex-shrink-0" />
                <span className="font-mono truncate">{contact.display}</span>
            </div>
            <div className="flex gap-2 items-center flex-shrink-0">
                {renderPrimaryAction()}
                {secondaryActions.length > 0 && (
                    <div className="relative">
                        <button ref={buttonRef} onClick={() => setIsMenuOpen(v => !v)} className="p-2 rounded-full hover:bg-gray-700 press-animation">
                            <Icon name="more-vertical" className="w-4 h-4" />
                        </button>
                        <AnimatePresence>
                            {isMenuOpen && (
                                <motion.div
                                    ref={menuRef}
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    className="absolute top-full right-0 mt-1 bg-gray-900 rounded-lg shadow-lg p-1 z-10 w-32 border border-gray-700"
                                >
                                    {secondaryActions}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};

const ContactCard = ({ content }: ContactCardProps) => {
    const contacts = useContactDetection(content);

    return (
        <AnimatePresence>
            {contacts.length > 0 && (
                <motion.div
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    exit={{ opacity: 0, y: 20, transition: { duration: 0.3 } }}
                    className="glass-card p-4 rounded-lg mt-4"
                >
                    <h3 className="text-lg font-bold mb-3 text-gray-300">联系方式</h3>
                    <div className="space-y-3">
                        {contacts.map((contact, index) => (
                            <ContactRow key={`${contact.type}-${contact.value}-${index}`} contact={contact} />
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ContactCard;