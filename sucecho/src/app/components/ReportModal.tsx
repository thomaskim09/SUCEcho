// sucecho/src/app/components/ReportModal.tsx
"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// NEW: Consolidated and refined list of common reasons
const commonReasons = [
    "人身攻击或骚扰",
    "仇恨或歧视言论",
    "校外商业广告或诈骗信息",
    "露骨或色情内容",
    "泄露他人隐私（电话、住址等）",
];

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: string) => void;
}

export default function ReportModal({ isOpen, onClose, onSubmit }: ReportModalProps) {
    const [selectedReason, setSelectedReason] = useState<string>('');
    const [customReason, setCustomReason] = useState('');
    // REMOVED: isNotFromSchool state is no longer needed

    const handleSubmit = () => {
        let finalReason = selectedReason;

        // If a custom reason is provided, append it to the selected common reason.
        if (customReason) {
            finalReason += finalReason ? ` - ${customReason}` : customReason;
        }

        // Ensure a reason is always submitted if the modal is used.
        onSubmit(finalReason || "未提供具体理由");

        // Reset state for the next time the modal is opened
        setSelectedReason('');
        setCustomReason('');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="p-6 rounded-lg shadow-xl w-full max-w-md"
                        style={{ backgroundColor: 'var(--background)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-xl font-bold font-mono text-accent mb-4">举报内容</h2>

                        {/* The list of selectable reasons */}
                        <div className="space-y-3">
                            {commonReasons.map((reason) => (
                                <button
                                    key={reason}
                                    onClick={() => setSelectedReason(reason)}
                                    className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedReason === reason ? 'bg-accent text-white border-accent' : 'bg-gray-800 border-gray-700 hover:border-accent'}`}
                                >
                                    {reason}
                                </button>
                            ))}
                        </div>

                        {/* The text area for a custom reason */}
                        <div className="mt-4 border-t border-gray-700 pt-4">
                            <textarea
                                value={customReason}
                                onChange={(e) => setCustomReason(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 focus:outline-none focus:border-accent"
                                placeholder="提供更多信息（选填）"
                                rows={3}
                            />
                        </div>

                        {/* REMOVED: The checkbox for "not from school" is gone */}

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={onClose}
                                className="bg-gray-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-opacity"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-opacity disabled:opacity-50"
                                // The submit button is disabled until a common reason is selected
                                disabled={!selectedReason}
                            >
                                确认举报
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}