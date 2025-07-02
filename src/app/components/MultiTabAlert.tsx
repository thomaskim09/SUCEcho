// sucecho/src/app/components/MultiTabAlert.tsx
"use client";

import { Logo } from './Logo';
import { motion, Variants } from 'framer-motion';

export default function MultiTabAlert() {
    const overlayVariants = {
        hidden: {
            opacity: 0,
            transition: { duration: 0.3 }
        },
        visible: {
            opacity: 1,
            transition: { duration: 0.3 }
        },
    };

    const modalVariants: Variants = {
        hidden: {
            opacity: 0,
            scale: 0.95,
            transition: { duration: 0.2, ease: "easeIn" }
        },
        visible: {
            opacity: 1,
            scale: 1,
            transition: { duration: 0.3, ease: "easeOut" }
        },
    };

    return (
        <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(10, 10, 20, 0.98)',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <motion.div
                variants={modalVariants}
                style={{
                    background: 'linear-gradient(135deg, #18181b 80%, #23233b 100%)',
                    borderRadius: '1.5rem',
                    boxShadow: '0 0 32px 4px #9F70FD, 0 0 0 1px #23233b',
                    margin: '2rem',
                    padding: '2.5rem 2rem',
                    maxWidth: '90vw',
                    border: '1.5px solid #9F70FD',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <Logo className="w-10 h-10" />
                    <span style={{
                        fontSize: '1.7rem',
                        fontWeight: 700,
                        color: '#e0e0e0',
                        textShadow: 'none',
                    }}>
                        SUC Echo
                    </span>
                </div>
                <div
                    style={{
                        fontSize: '1.1rem',
                        color: '#9F70FD',
                        textShadow: '0 0 8px #000, 0 0 2px #fff',
                        marginBottom: '1.2rem',
                        textAlign: 'center',
                        fontWeight: 600,
                    }}
                >
                    多标签页限制
                </div>
                <div
                    style={{
                        fontSize: '1.1rem',
                        color: '#e0e0e0',
                        textShadow: '0 0 4px #9F70FD',
                        textAlign: 'center',
                    }}
                >
                    为保证公平和实时更新，系统仅允许打开一个标签页。<br />请确保只打开一个 SUC Echo 标签页并刷新此页面。<br />
                </div>
            </motion.div>
        </motion.div>
    );
}