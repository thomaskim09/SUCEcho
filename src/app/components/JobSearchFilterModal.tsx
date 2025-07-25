// src/app/components/JobSearchFilterModal.tsx
"use client";

import { motion, AnimatePresence } from 'framer-motion';
import Portal from './Portal'; // Import the Portal component

interface JobSearchFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    minRating: number;
    setMinRating: (rating: number) => void;
    dateFilter: string;
    setDateFilter: (filter: string) => void;
    applyFilters: () => void;
}

export default function JobSearchFilterModal({
    isOpen,
    onClose,
    minRating,
    setMinRating,
    dateFilter,
    setDateFilter,
    applyFilters,
}: JobSearchFilterModalProps) {
    return (
        <Portal>
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
                            <h2 className="text-xl font-bold font-mono text-accent mb-4">筛选</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-gray-300 mb-2" htmlFor="minRating">最低评价</label>
                                    <select id="minRating" value={minRating} onChange={(e) => setMinRating(Number(e.target.value))} className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 focus:outline-none focus:border-accent">
                                        <option value="0">所有</option>
                                        <option value="1">1 Star+</option>
                                        <option value="2">2 Stars+</option>
                                        <option value="3">3 Stars+</option>
                                        <option value="4">4 Stars+</option>
                                        <option value="5">5 Stars</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-300 mb-2" htmlFor="dateFilter">日期范围</label>
                                    <select id="dateFilter" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 focus:outline-none focus:border-accent">
                                        <option value="all">所有时间</option>
                                        <option value="7d">最近 7 天</option>
                                        <option value="30d">最近 30 天</option>
                                        <option value="90d">最近 3 个月</option>
                                        <option value="180d">最近 6 个月</option>
                                        <option value="365d">最近 1 年</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={onClose}
                                    className="bg-gray-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-opacity"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={() => { applyFilters(); onClose(); }}
                                    className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-opacity"
                                >
                                    应用
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Portal>
    );
}