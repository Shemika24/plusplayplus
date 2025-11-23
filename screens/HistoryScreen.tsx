import React, { useMemo, useState } from 'react';
import { Transaction, TransactionHistoryScreenProps } from '../types';

// Helper to format timestamp into a date group key (e.g., "Today", "Yesterday", "June 29, 2024")
const formatDateGroup = (timestamp: number): string => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    }
    if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    }
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

// Helper to format timestamp into just the time
const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const TransactionHistoryScreen: React.FC<TransactionHistoryScreenProps> = ({ transactions, onBack }) => {
    const [selectedDate, setSelectedDate] = useState(''); // YYYY-MM-DD format from input

    // 1. Filter transactions based on selectedDate
    const filteredTransactions = useMemo(() => {
        if (!selectedDate) {
            return transactions;
        }
        // Input format is YYYY-MM-DD. We need to match local user dates.
        const filterDate = new Date(selectedDate);
        // Adjust for timezone to avoid off-by-one-day errors when converting to string.
        const filterDateString = new Date(filterDate.getTime() + filterDate.getTimezoneOffset() * 60000).toDateString();
        
        return transactions.filter(t => {
            const transactionDate = new Date(t.timestamp).toDateString();
            return transactionDate === filterDateString;
        });
    }, [transactions, selectedDate]);

    // 2. Group the (now filtered) transactions
    const groupedTransactions = useMemo(() => filteredTransactions.reduce((acc, transaction) => {
        const dateKey = formatDateGroup(transaction.timestamp);
        if (!acc[dateKey]) {
            acc[dateKey] = [];
        }
        acc[dateKey].push(transaction);
        return acc;
    }, {} as Record<string, Transaction[]>), [filteredTransactions]);
    
    // 3. Sort group keys to have Today, Yesterday, then descending dates
    const sortedGroupKeys = useMemo(() => Object.keys(groupedTransactions).sort((a, b) => {
        const dateA = a === 'Today' ? new Date().setHours(0,0,0,0) : a === 'Yesterday' ? new Date(new Date().setDate(new Date().getDate() - 1)).setHours(0,0,0,0) : new Date(a).getTime();
        const dateB = b === 'Today' ? new Date().setHours(0,0,0,0) : b === 'Yesterday' ? new Date(new Date().setDate(new Date().getDate() - 1)).setHours(0,0,0,0) : new Date(b).getTime();
        return dateB - dateA;
    }), [groupedTransactions]);

    // 4. Calculate daily stats for display
    const dailyStats = useMemo(() => {
        return Object.keys(groupedTransactions).reduce((acc, dateGroup) => {
            const dailyTransactions = groupedTransactions[dateGroup];

            const adsWatched = dailyTransactions.filter(
                t => !t.isDebit && (t.type === 'task' || t.type === 'auto_ad') && t.description.toLowerCase().includes('ad')
            ).length;

            const pointsEarned = dailyTransactions.reduce((sum, t) => {
                if (!t.isDebit && t.amount.toLowerCase().includes('points')) {
                    const points = parseInt(t.amount.replace(/[^0-9]/g, ''), 10);
                    return sum + (isNaN(points) ? 0 : points);
                }
                return sum;
            }, 0);

            acc[dateGroup] = { adsWatched, pointsEarned };
            return acc;
        }, {} as Record<string, { adsWatched: number; pointsEarned: number }>);
    }, [groupedTransactions]);

    return (
        <div className="animate-fadeIn space-y-6">
            <div className="flex justify-between items-center gap-4 sticky top-0 bg-light py-2 -mx-4 px-4 z-10 shadow-sm border-b border-gray-medium">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 -ml-2 text-dark hover:text-primary" aria-label="Go back">
                        <i className="fa-solid fa-arrow-left text-2xl"></i>
                    </button>
                    <h1 className="text-xl md:text-2xl font-bold text-dark">Transaction History</h1>
                </div>
                <div className="relative flex items-center">
                    <label htmlFor="date-filter" className="text-dark p-2" aria-label="Filter by date">
                        <i className="fa-solid fa-calendar-day"></i>
                    </label>
                    <input
                        id="date-filter"
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-32 py-1 border border-gray-medium rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                     {selectedDate && (
                        <button onClick={() => setSelectedDate('')} className="ml-2 text-gray hover:text-dark" aria-label="Clear date filter">
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    )}
                </div>
            </div>

            {sortedGroupKeys.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-xl shadow-sm">
                    <p className="font-semibold text-gray">No transactions found.</p>
                    <p className="text-sm text-gray mt-1">
                        {selectedDate ? "Try selecting a different date." : "Complete tasks to see your history!"}
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {sortedGroupKeys.map(dateGroup => (
                        <div key={dateGroup}>
                            <div className="flex justify-between items-center mb-3 px-2 sticky top-[68px] bg-light py-2 z-5 border-b border-gray-light">
                                <h2 className="text-lg font-bold text-dark">{dateGroup}</h2>
                                <div className="flex items-center gap-3 text-xs text-gray font-semibold">
                                    <span className="flex items-center gap-1.5" title="Ads Watched">
                                        <i className="fa-solid fa-rectangle-ad text-primary text-base"></i>
                                        {dailyStats[dateGroup]?.adsWatched || 0}
                                    </span>
                                    <span className="flex items-center gap-1.5" title="Points Earned">
                                        <i className="fa-solid fa-coins text-secondary text-base"></i>
                                        {dailyStats[dateGroup]?.pointsEarned.toLocaleString() || 0}
                                    </span>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-light">
                                {groupedTransactions[dateGroup].map(item => (
                                    <div key={item.id} className="flex items-center gap-4 py-3 px-4">
                                        <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-xl ${item.isDebit ? 'text-error' : 'text-success'}`}>
                                            <i className={item.iconClass}></i>
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <p className="font-semibold text-dark truncate">{item.description}</p>
                                            <p className="text-xs text-gray">{formatTime(item.timestamp)}</p>
                                        </div>
                                        <p className={`font-bold text-base whitespace-nowrap ${item.isDebit ? 'text-error' : 'text-success'}`}>
                                            {item.amount}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TransactionHistoryScreen;
