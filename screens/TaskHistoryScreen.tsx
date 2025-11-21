
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { TaskHistory, UserProfile } from '../types';
import { getTaskHistoryPaginated, getTaskHistoryCount } from '../services/firestoreService';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

interface TaskHistoryScreenProps {
    userProfile: UserProfile;
}

const TaskHistoryItem: React.FC<{ item: TaskHistory }> = ({ item }) => {
    const formattedDateTime = useMemo(() => {
        let dateObj: Date;

        if (item.timestamp && typeof item.timestamp.toDate === 'function') {
            dateObj = item.timestamp.toDate();
        } else if (item.timestamp && item.timestamp instanceof Date) {
             dateObj = item.timestamp;
        } else {
            dateObj = new Date(item.date);
        }

        return dateObj.toLocaleString("en-US", {
            timeZone: "Africa/Maputo",
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }, [item]);

    return (
        <div className="flex items-center p-4 border-b border-[var(--border-color)] last:border-b-0 bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] transition-colors">
            <div className="w-10 h-10 rounded-full flex items-center justify-center mr-4 bg-[var(--bg-input)]">
                <i className={`${item.icon} ${item.iconColor} text-lg`}></i>
            </div>
            <div className="flex-1">
                <p className="font-bold text-sm text-[var(--dark)]">{item.title}</p>
                <p className="text-xs text-[var(--gray)] mt-0.5">{formattedDateTime}</p>
            </div>
            <div className="text-right">
                <p className="font-bold text-sm text-green-600">+{item.reward}</p>
                <p className="text-xs text-[var(--gray)]">Points</p>
            </div>
        </div>
    )
}

type DateRangeOption = 'All' | 'Today' | 'Yesterday' | 'Last7' | 'Last30' | 'LastYear' | 'Custom';
type TaskTypeOption = 'All' | 'Tasks' | 'Check-in' | 'Lucky Wheel' | 'Referral' | 'Bonus';

const TaskHistoryScreen: React.FC<TaskHistoryScreenProps> = ({ userProfile }) => {
    const [history, setHistory] = useState<TaskHistory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [totalCount, setTotalCount] = useState<number | null>(null);

    // Filter States
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [dateRange, setDateRange] = useState<DateRangeOption>('All');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [taskType, setTaskType] = useState<TaskTypeOption>('All');
    
    const [appliedDateRange, setAppliedDateRange] = useState<DateRangeOption>('All');
    const [appliedStart, setAppliedStart] = useState<Date | undefined>(undefined);
    const [appliedEnd, setAppliedEnd] = useState<Date | undefined>(undefined);

    const observerTarget = useRef<HTMLDivElement>(null);

    const calculateDateRange = (option: DateRangeOption, customStart?: string, customEnd?: string): { start?: Date, end?: Date } => {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        
        switch (option) {
            case 'Today':
                return { start: todayStart, end: todayEnd };
            case 'Yesterday':
                const yesterStart = new Date(todayStart);
                yesterStart.setDate(yesterStart.getDate() - 1);
                const yesterEnd = new Date(todayEnd);
                yesterEnd.setDate(yesterEnd.getDate() - 1);
                return { start: yesterStart, end: yesterEnd };
            case 'Last7':
                const last7Start = new Date(todayStart);
                last7Start.setDate(last7Start.getDate() - 6);
                return { start: last7Start, end: todayEnd };
            case 'Last30':
                const last30Start = new Date(todayStart);
                last30Start.setDate(last30Start.getDate() - 29);
                return { start: last30Start, end: todayEnd };
            case 'LastYear':
                const lastYearStart = new Date(todayStart);
                lastYearStart.setFullYear(lastYearStart.getFullYear() - 1);
                return { start: lastYearStart, end: todayEnd };
            case 'Custom':
                if (customStart && customEnd) {
                    const start = new Date(customStart);
                    const end = new Date(customEnd);
                    end.setHours(23, 59, 59, 999);
                    return { start, end };
                }
                return {};
            case 'All':
            default:
                return {};
        }
    };

    const fetchHistory = useCallback(async (isInitial = false) => {
        if (isInitial) {
            setIsLoading(true);
            setLastDoc(null); // Reset cursor
        } else {
            if (isLoadingMore || !hasMore) return;
            setIsLoadingMore(true);
        }

        try {
            const currentStartAfter = isInitial ? null : lastDoc;
            
            const { history: newHistory, lastVisible } = await getTaskHistoryPaginated(
                userProfile.uid, 
                currentStartAfter,
                appliedStart,
                appliedEnd
            );

            if (isInitial) {
                 const count = await getTaskHistoryCount(userProfile.uid, appliedStart, appliedEnd);
                 setTotalCount(count);
            }
            
            setHistory(prev => isInitial ? newHistory : [...prev, ...newHistory]);
            setLastDoc(lastVisible);

            if (!lastVisible || newHistory.length === 0) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }
        } catch (error) {
            console.error("Error fetching task history:", error);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [userProfile.uid, lastDoc, isLoadingMore, hasMore, appliedStart, appliedEnd]);

    // Intersection Observer
    useEffect(() => {
        const element = observerTarget.current;
        if (!element || isLoading || !hasMore) return;

        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && !isLoadingMore && hasMore) {
                    fetchHistory(false);
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(element);

        return () => {
            if (element) observer.unobserve(element);
        };
    }, [fetchHistory, hasMore, isLoading, isLoadingMore]);

    // Trigger fetch when applied date filters change
    useEffect(() => {
        fetchHistory(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appliedStart, appliedEnd]);

    // Filter logic for Client-Side filtering of Task Type
    const filteredHistory = useMemo(() => {
        if (taskType === 'All') return history;

        return history.filter(item => {
            const title = item.title.toLowerCase();
            const icon = item.icon.toLowerCase();
            
            switch (taskType) {
                case 'Tasks':
                    return title.includes('ad') || title.includes('task') || icon.includes('list-check');
                case 'Check-in':
                    return title.includes('check-in') || icon.includes('calendar-check');
                case 'Lucky Wheel':
                    return title.includes('wheel') || title.includes('spin') || icon.includes('dharmachakra');
                case 'Referral':
                    return title.includes('referral') || icon.includes('users');
                case 'Bonus':
                    return title.includes('bonus') || title.includes('combo') || icon.includes('gift');
                default:
                    return true;
            }
        });
    }, [history, taskType]);

    const displayCount = taskType === 'All' ? totalCount : filteredHistory.length;

    const applyFilters = () => {
        const { start, end } = calculateDateRange(dateRange, customStartDate, customEndDate);
        setAppliedStart(start);
        setAppliedEnd(end);
        setAppliedDateRange(dateRange);
        setIsFilterOpen(false);
    };
    
    const resetFilters = () => {
        setDateRange('All');
        setCustomStartDate('');
        setCustomEndDate('');
        setTaskType('All');
        setAppliedStart(undefined);
        setAppliedEnd(undefined);
        setAppliedDateRange('All');
        setIsFilterOpen(false);
    };

    return (
        <div className="flex flex-col h-full bg-[var(--gray-light)]">
            <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-card)] sticky top-0 z-10 shadow-sm">
                <div className="flex justify-between items-center">
                    <h1 className="text-lg font-bold text-[var(--dark)]">
                        Task History {displayCount !== null && <span className="text-sm font-medium text-[var(--gray)] ml-1">({displayCount})</span>}
                    </h1>
                    <button 
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${isFilterOpen || dateRange !== 'All' || taskType !== 'All' ? 'bg-blue-100 text-[var(--primary)]' : 'bg-[var(--bg-input)] text-[var(--gray)]'}`}
                    >
                        <i className="fa-solid fa-filter"></i>
                    </button>
                </div>

                {/* Collapsible Filter Panel */}
                {isFilterOpen && (
                    <div className="mt-4 animate-fadeIn space-y-4">
                        {/* Date Range Section */}
                        <div>
                            <p className="text-xs font-bold text-[var(--gray)] mb-2 uppercase tracking-wider">Date Range</p>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { id: 'All', label: 'All Time' },
                                    { id: 'Today', label: 'Today' },
                                    { id: 'Yesterday', label: 'Yesterday' },
                                    { id: 'Last7', label: '7 Days' },
                                    { id: 'Last30', label: '30 Days' },
                                    { id: 'LastYear', label: '1 Year' },
                                    { id: 'Custom', label: 'Custom' },
                                ].map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setDateRange(opt.id as DateRangeOption)}
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${dateRange === opt.id ? 'bg-[var(--primary)] text-white border-[var(--primary)]' : 'bg-[var(--bg-card)] text-[var(--gray)] border-[var(--border-color)] hover:bg-[var(--bg-card-hover)]'}`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                            
                            {dateRange === 'Custom' && (
                                <div className="flex items-center gap-2 mt-3">
                                    <input 
                                        type="date" 
                                        value={customStartDate}
                                        onChange={(e) => setCustomStartDate(e.target.value)}
                                        className="w-1/2 p-2 border border-[var(--border-color)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)] bg-[var(--bg-input)] text-[var(--dark)]"
                                    />
                                    <span className="text-gray-400">-</span>
                                    <input 
                                        type="date" 
                                        value={customEndDate}
                                        onChange={(e) => setCustomEndDate(e.target.value)}
                                        className="w-1/2 p-2 border border-[var(--border-color)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)] bg-[var(--bg-input)] text-[var(--dark)]"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Task Type Section */}
                        <div>
                            <p className="text-xs font-bold text-[var(--gray)] mb-2 uppercase tracking-wider">Task Type</p>
                            <div className="flex flex-wrap gap-2">
                                {['All', 'Tasks', 'Check-in', 'Lucky Wheel', 'Referral', 'Bonus'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setTaskType(type as TaskTypeOption)}
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${taskType === type ? 'bg-[var(--secondary)] text-white border-[var(--secondary)]' : 'bg-[var(--bg-card)] text-[var(--gray)] border-[var(--border-color)] hover:bg-[var(--bg-card-hover)]'}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-2">
                            <button 
                                onClick={resetFilters}
                                className="flex-1 py-2 text-sm font-bold text-[var(--gray)] bg-[var(--bg-input)] rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                            >
                                Reset
                            </button>
                            <button 
                                onClick={applyFilters}
                                className="flex-1 py-2 text-sm font-bold text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--primary-dark)] transition-colors"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                )}
                
                {/* Active Filters Summary (if panel closed) */}
                {!isFilterOpen && (dateRange !== 'All' || taskType !== 'All') && (
                    <div className="mt-2 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {dateRange !== 'All' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 whitespace-nowrap">
                                {dateRange === 'Custom' ? `${customStartDate} - ${customEndDate}` : dateRange}
                            </span>
                        )}
                        {taskType !== 'All' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 whitespace-nowrap">
                                {taskType}
                            </span>
                        )}
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto">
                 {isLoading ? (
                    <div className="text-center p-8 text-[var(--gray)]">
                        <i className="fa-solid fa-spinner fa-spin text-4xl"></i>
                    </div>
                 ) : filteredHistory.length > 0 ? (
                    <>
                        {filteredHistory.map(item => (
                            <TaskHistoryItem key={item.id as string} item={item} />
                        ))}
                        
                        {/* Infinite Scroll Loader Sentinel */}
                        {hasMore && (
                            <div ref={observerTarget} className="py-6 flex justify-center items-center">
                                {isLoadingMore ? (
                                    <div className="flex items-center text-[var(--gray)] text-sm">
                                        <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                                        Loading more...
                                    </div>
                                ) : (
                                    <div className="h-4"></div> 
                                )}
                            </div>
                        )}

                        {!hasMore && (
                            <div className="pt-8 pb-24 text-center text-[var(--gray)] flex flex-col items-center justify-center opacity-60">
                                <i className="fa-regular fa-circle-check text-2xl mb-2"></i>
                                <p className="text-sm font-medium">No more history</p>
                            </div>
                        )}
                    </>
                 ) : (
                    <div className="text-center p-8 text-[var(--gray)]">
                        <i className="fa-solid fa-filter-circle-xmark text-4xl mb-4 text-gray-300"></i>
                        <p>No records found.</p>
                        <p className="text-sm">Try adjusting your filters.</p>
                    </div>
                 )}
            </div>
            <style>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default TaskHistoryScreen;
