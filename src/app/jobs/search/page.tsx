// src/app/jobs/search/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/app/components/Icon';
import JobSearchFeed from '@/app/components/JobSearchFeed';
import JobSearchFilterModal from '@/app/components/JobSearchFilterModal';

export default function JobSearchPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [minRating, setMinRating] = useState(0);
    const [dateFilter, setDateFilter] = useState('all');
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [submittedSearch, setSubmittedSearch] = useState<{
        term: string;
        rating: number;
        date: string;
    } | null>({ term: '', rating: 0, date: 'all' });
    const router = useRouter();

    useEffect(() => {
        const rootElement = document.documentElement;
        rootElement.classList.add('jobs-bg');
        return () => {
            rootElement.classList.remove('jobs-bg');
        };
    }, []);

    const triggerSearch = useCallback(() => {
        setSubmittedSearch({ term: searchTerm, rating: minRating, date: dateFilter });
    }, [searchTerm, minRating, dateFilter]);

    useEffect(() => {
        const handler = setTimeout(() => {
            if (searchTerm !== debouncedSearchTerm) {
                setDebouncedSearchTerm(searchTerm);
                triggerSearch();
            }
        }, 500); // 500ms debounce delay

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm, triggerSearch, debouncedSearchTerm]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            triggerSearch();
        }
    };

    return (
        <div className="container mx-auto max-w-2xl p-4">
            <header className="py-4">
                <button onClick={() => router.back()} className="text-accent hover:underline mb-4 flex items-center gap-2">
                    <Icon name="arrow-left" />
                    返回
                </button>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Icon name="search" className="text-gray-400" />
                    </div>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 pl-10 pr-10 focus:outline-none focus:border-accent"
                        placeholder="搜索职位..."
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <button onClick={() => setIsFilterModalOpen(true)} className="text-gray-400 hover:text-white">
                            <Icon name="filter" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="mt-4">
                {submittedSearch && (
                    <JobSearchFeed
                        key={`${submittedSearch.term}-${submittedSearch.rating}-${submittedSearch.date}`}
                        searchTerm={submittedSearch.term}
                        minRating={submittedSearch.rating}
                        dateFilter={submittedSearch.date}
                    />
                )}
            </main>
            <JobSearchFilterModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                minRating={minRating}
                setMinRating={setMinRating}
                dateFilter={dateFilter}
                setDateFilter={setDateFilter}
                applyFilters={triggerSearch}
            />
        </div>
    );
}