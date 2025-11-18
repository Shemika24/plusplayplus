
import React, { useState, useEffect, useCallback } from 'react';
import { Withdrawal, UserProfile } from '../types';
import { getWithdrawalHistoryPaginated } from '../services/firestoreService';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

interface WithdrawalHistoryScreenProps {
    userProfile: UserProfile;
}

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
    const icons = {
        Completed: 'fa-solid fa-check-circle text-green-500',
        Pending: 'fa-solid fa-hourglass-half text-yellow-500',
        Failed: 'fa-solid fa-times-circle text-red-500',
    };

    return (
        <div className="flex items-center p-4 border-b border-gray-200 last:border-b-0 bg-white">
            <div className="w-10 h-10 rounded-full flex items-center justify-center mr-4 bg-gray-100">
                <i className={`${icons[item.status]} text-xl`}></i>
            </div>
            <div className="flex-1">
                <p className="font-bold text-sm text-gray-800">{item.method}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.date}</p>
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

    const fetchHistory = useCallback(async (isInitial = false) => {
        if (isInitial) {
            setIsLoading(true);
        } else {
            if (isLoadingMore || !hasMore) return;
            setIsLoadingMore(true);
        }

        try {
            const startAfter = isInitial ? null : lastDoc;
            const { history: newHistory, lastVisible } = await getWithdrawalHistoryPaginated(userProfile.uid, startAfter);
            
            setHistory(prev => isInitial ? newHistory : [...prev, ...newHistory]);
            setLastDoc(lastVisible);

            if (!lastVisible || newHistory.length === 0) {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Error fetching withdrawal history:", error);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [userProfile.uid, lastDoc, isLoadingMore, hasMore]);

    useEffect(() => {
        fetchHistory(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userProfile.uid]);


    return (
        <div className="flex flex-col h-full bg-gray-50">
            <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
                <h1 className="text-lg font-bold text-gray-800">
                    Withdrawal History
                </h1>
            </div>
            <div className="flex-1 overflow-y-auto">
                 {isLoading ? (
                    <div className="text-center p-8 text-gray-500">
                        <i className="fa-solid fa-spinner fa-spin text-4xl"></i>
                    </div>
                 ) : history.length > 0 ? (
                    <>
                        {history.map(item => (
                            <WithdrawalItem key={item.id as string} item={item} />
                        ))}
                        {hasMore && (
                            <div className="p-4 flex justify-center">
                                <button
                                    onClick={() => fetchHistory(false)}
                                    disabled={isLoadingMore}
                                    className="bg-[var(--primary)] text-white font-bold py-2 px-6 rounded-lg hover:bg-[var(--primary-dark)] transition-colors disabled:bg-gray-400"
                                >
                                    {isLoadingMore ? (
                                        <><i className="fa-solid fa-spinner fa-spin mr-2"></i>Loading...</>
                                    ) : (
                                        'Load More'
                                    )}
                                </button>
                            </div>
                        )}
                    </>
                 ) : (
                    <div className="text-center p-8 text-gray-500">
                        <i className="fa-solid fa-file-invoice-dollar text-4xl mb-4"></i>
                        <p>No withdrawal history yet.</p>
                        <p className="text-sm">Request a withdrawal to see it here!</p>
                    </div>
                 )}
            </div>
        </div>
    );
};

export default WithdrawalHistoryScreen;
