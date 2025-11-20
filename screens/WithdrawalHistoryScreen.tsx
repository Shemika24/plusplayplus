
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Withdrawal, UserProfile } from '../types';
import { getWithdrawalHistoryPaginated, getWithdrawalHistoryCount } from '../services/firestoreService';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

interface WithdrawalHistoryScreenProps {
    userProfile: UserProfile;
}

type DateRangeOption = 'All' | 'Today' | 'Yesterday' | 'Last7' | 'Last30' | 'LastYear' | 'Custom';
type StatusOption = 'All' | 'Completed' | 'Pending' | 'Failed';
type MethodOption = 'All' | 'PayPal' | 'Payeer' | 'Payoneer' | 'Airtm' | 'Crypto';

const StatusBadge: React.FC<{ status: Withdrawal['status'] }> = ({ status }) => {
    const styles = {
        Completed: 'bg-green-100 text-green-700',
        Pending: 'bg-yellow-100 text-yellow-700',
        Failed: 'bg-red-100 text-red-700',
    };
    return (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>
            {status}
        </span>
    );
};

const WithdrawalItem: React.FC<{ item: Withdrawal }> = ({ item }) => {
    const icons: Record<string, string> = {
        Completed: 'fa-solid fa-check-circle text-green-500',
        Pending: 'fa-solid fa-hourglass-half text-yellow-500',
        Failed: 'fa-solid fa-times-circle text-red-500',
    };

    const formattedDateTime = useMemo(() => {
        let dateObj: Date;
        if (item.timestamp && typeof item.timestamp.toDate === 'function') {
            dateObj = item.timestamp.toDate();
        } else {
            dateObj = new Date(item.date);
        }

        return dateObj.toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }, [item]);

    return (
        <div className="flex items-center p-4 border-b border-gray-200 last:border-b-0 bg-white">
            <div className="w-10 h-10 rounded-full flex items-center justify-center mr-4 bg-gray-100">
                <i className={`${icons[item.status] || 'fa-solid fa-question text-gray-400'} text-xl`}></i>
            </div>
            <div className="flex-1">
                <p className="font-bold text-sm text-gray-800">{item.method}</p>
                <p className="text-xs text-gray-500 mt-0.5">{formattedDateTime}</p>
            </div>
            <div className="text-right">
                <p className="font-bold text-sm text-gray-800">${item.amount.toFixed(2)}</p>
                <StatusBadge status={item.status} />
            </div>
        </div>
    )
}

const WithdrawalHistoryScreen: React.FC<WithdrawalHistoryScreenProps> = ({ userProfile }) => {
    const [history, setHistory] = useState<Withdrawal[]>([]);
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
    const [statusFilter, setStatusFilter] = useState<StatusOption>('All');
    const [methodFilter, setMethodFilter] = useState<MethodOption>('All');
    
    // Applied Filter States (to trigger fetches)
    const [appliedDateRange, setAppliedDateRange] = useState<DateRangeOption>('All');
    const [appliedStart, setAppliedStart] = useState<Date | undefined>(undefined);
    const [appliedEnd, setAppliedEnd] = useState<Date | undefined>(undefined);

    // Ref for Infinite Scroll
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
            
            const { history: newHistory, lastVisible } = await getWithdrawalHistoryPaginated(
                userProfile.uid, 
                currentStartAfter,
                appliedStart,
                appliedEnd
            );

            if (isInitial) {
                 const count = await getWithdrawalHistoryCount(userProfile.uid, appliedStart, appliedEnd);
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
            console.error("Error fetching withdrawal history:", error);
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
        setStatusFilter('All');
        setMethodFilter('All');
        setAppliedStart(undefined);
        setAppliedEnd(undefined);
        setAppliedDateRange('All');
        setIsFilterOpen(false);
    };

    // Client-side Filtering
    const filteredHistory = useMemo(() => {
        return history.filter(item => {
            const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
            
            let matchesMethod = true;
            if (methodFilter !== 'All') {
                if (methodFilter === 'Crypto') {
                    // Assuming Crypto methods might be specific names like 'Tron', 'Litecoin', etc.
                    // or stored as 'Crypto'. Adjust based on exact storage format.
                    // Based on WithdrawScreen, stored as 'Tron (TRX)', 'Litecoin (LTC)', etc.
                    const commonMethods = ['PayPal', 'Payeer', 'Payoneer', 'Airtm'];
                    matchesMethod = !commonMethods.includes(item.method);
                } else {
                    matchesMethod = item.method === methodFilter;
                }
            }

            return matchesStatus && matchesMethod;
        });
    }, [history, statusFilter, methodFilter]);

    const displayCount = (statusFilter === 'All' && methodFilter === 'All') ? totalCount : filteredHistory.length;

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
                <div className="flex justify-between items-center">
                    <h1 className="text-lg font-bold text-gray-800">
                        Withdrawal History {displayCount !== null && <span className="text-sm font-medium text-gray-500 ml-1">({displayCount})</span>}
                    </h1>
                    <button 
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${isFilterOpen || dateRange !== 'All' || statusFilter !== 'All' || methodFilter !== 'All' ? 'bg-blue-100 text-[var(--primary)]' : 'bg-gray-100 text-gray-600'}`}
                    >
                        <i className="fa-solid fa-filter"></i>
                    </button>
                </div>

                 {/* Filter Panel */}
                 {isFilterOpen && (
                    <div className="mt-4 animate-fadeIn space-y-4">
                        {/* Date Range */}
                        <div>
                            <p className="text-xs font-bold text-[var(--gray)] mb-2 uppercase tracking-wider">Date Range</p>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { id: 'All', label: 'All Time' },
                                    { id: 'Last7', label: '7 Days' },
                                    { id: 'Last30', label: '30 Days' },
                                    { id: 'LastYear', label: '1 Year' },
                                    { id: 'Custom', label: 'Custom' },
                                ].map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setDateRange(opt.id as DateRangeOption)}
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${dateRange === opt.id ? 'bg-[var(--primary)] text-white border-[var(--primary)]' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                            {dateRange === 'Custom' && (
                                <div className="flex items-center gap-2 mt-3">
                                    <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="w-1/2 p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[var(--primary)]" />
                                    <span className="text-gray-400">-</span>
                                    <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="w-1/2 p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[var(--primary)]" />
                                </div>
                            )}
                        </div>

                        {/* Status */}
                        <div>
                            <p className="text-xs font-bold text-[var(--gray)] mb-2 uppercase tracking-wider">Status</p>
                            <div className="flex flex-wrap gap-2">
                                {['All', 'Completed', 'Pending', 'Failed'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => setStatusFilter(status as StatusOption)}
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${statusFilter === status ? 'bg-[var(--secondary)] text-white border-[var(--secondary)]' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>

                         {/* Method */}
                         <div>
                            <p className="text-xs font-bold text-[var(--gray)] mb-2 uppercase tracking-wider">Payment Method</p>
                            <div className="flex flex-wrap gap-2">
                                {['All', 'PayPal', 'Payeer', 'Payoneer', 'Airtm', 'Crypto'].map((method) => (
                                    <button
                                        key={method}
                                        onClick={() => setMethodFilter(method as MethodOption)}
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${methodFilter === method ? 'bg-purple-500 text-white border-purple-500' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                                    >
                                        {method}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-2">
                            <button onClick={resetFilters} className="flex-1 py-2 text-sm font-bold text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">Reset</button>
                            <button onClick={applyFilters} className="flex-1 py-2 text-sm font-bold text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--primary-dark)] transition-colors">Apply Filters</button>
                        </div>
                    </div>
                 )}

                {/* Active Filters Summary */}
                {!isFilterOpen && (dateRange !== 'All' || statusFilter !== 'All' || methodFilter !== 'All') && (
                    <div className="mt-2 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {dateRange !== 'All' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 whitespace-nowrap">
                                {dateRange === 'Custom' ? `${customStartDate} - ${customEndDate}` : dateRange}
                            </span>
                        )}
                        {statusFilter !== 'All' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 whitespace-nowrap">
                                {statusFilter}
                            </span>
                        )}
                         {methodFilter !== 'All' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 whitespace-nowrap">
                                {methodFilter}
                            </span>
                        )}
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto">
                 {isLoading ? (
                    <div className="text-center p-8 text-gray-500">
                        <i className="fa-solid fa-spinner fa-spin text-4xl"></i>
                    </div>
                 ) : filteredHistory.length > 0 ? (
                    <>
                        {filteredHistory.map(item => (
                            <WithdrawalItem key={item.id as string} item={item} />
                        ))}
                        
                        {hasMore && (
                            <div ref={observerTarget} className="py-6 flex justify-center items-center">
                                {isLoadingMore ? (
                                    <div className="flex items-center text-gray-500 text-sm">
                                        <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                                        Loading more...
                                    </div>
                                ) : (
                                    <div className="h-4"></div> 
                                )}
                            </div>
                        )}

                        {!hasMore && (
                            <div className="pt-8 pb-24 text-center text-gray-400 flex flex-col items-center justify-center opacity-60">
                                <i className="fa-regular fa-circle-check text-2xl mb-2"></i>
                                <p className="text-sm font-medium">No more history</p>
                            </div>
                        )}
                    </>
                 ) : (
                    <div className="text-center p-8 text-gray-500">
                        <i className="fa-solid fa-filter-circle-xmark text-4xl mb-4 text-gray-300"></i>
                        <p>No withdrawal history found.</p>
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

export default WithdrawalHistoryScreen;
