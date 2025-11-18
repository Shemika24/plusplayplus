

import React, { useState, useEffect } from 'react';
import { RankedUser, UserProfile } from '../types';
import { getRankings } from '../services/firestoreService';

interface RankScreenProps {
    currentUserProfile: UserProfile;
}

const TopRankerCard: React.FC<{ user: RankedUser, medalColor: string, icon: string, sizeClass: string }> = ({ user, medalColor, icon, sizeClass }) => (
    <div className={`flex flex-col items-center relative ${sizeClass}`}>
        <div className={`absolute -top-3 w-8 h-8 rounded-full flex items-center justify-center text-white text-lg shadow-md ${medalColor}`}>
            <i className={`fa-solid ${icon}`}></i>
        </div>
        {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-20 h-20 rounded-full border-4 border-white shadow-lg mb-2 bg-gray-300 object-cover" />
        ) : (
             <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg mb-2 bg-gray-300 flex items-center justify-center">
                <i className="fa-solid fa-user text-4xl text-gray-500"></i>
            </div>
        )}
        <p className="font-bold text-white text-sm text-center">{user.name}</p>
        <p className="font-bold text-yellow-300 text-lg">{user.points.toLocaleString()}</p>
    </div>
);

const RankListItem: React.FC<{ user: RankedUser }> = ({ user }) => (
    <div className={`flex items-center p-3 rounded-lg ${user.isCurrentUser ? 'bg-blue-100 border-2 border-blue-400' : 'bg-white'}`}>
        <span className="font-bold text-gray-500 w-8 text-center">{user.rank}</span>
        {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full mx-3 bg-gray-300 object-cover" />
        ) : (
            <div className="w-10 h-10 rounded-full mx-3 bg-gray-400 flex items-center justify-center">
                <i className="fa-solid fa-user text-xl text-white"></i>
            </div>
        )}
        <p className="flex-grow font-semibold text-gray-800">{user.name}</p>
        <p className="font-bold text-blue-600">{user.points.toLocaleString()} pts</p>
    </div>
);

const RankScreen: React.FC<RankScreenProps> = ({ currentUserProfile }) => {
    const [rankings, setRankings] = useState<RankedUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchRankings = async () => {
            setIsLoading(true);
            // Pass current user's UID to identify them in the rankings
            const fetchedRankings = await getRankings(currentUserProfile.uid);
            setRankings(fetchedRankings);
            setIsLoading(false);
        };
        fetchRankings();
    }, [currentUserProfile.uid]);

    const topThree = rankings.slice(0, 3);
    const others = rankings.slice(3);

    return (
        <div className="pb-24 text-[var(--dark)] min-h-full">
            {/* Top 3 Podium */}
            <div className="bg-gradient-to-b from-[#4a6bff] to-[#3a5bef] p-6 pt-10 rounded-b-3xl shadow-lg">
                <h2 className="text-2xl font-bold text-white text-center mb-6">Top Earners</h2>
                <div className="flex justify-center items-end space-x-4 h-40">
                    {isLoading ? (
                        <div className="w-full flex justify-around items-end">
                            <div className="w-20 h-28 bg-white/20 rounded-t-lg animate-pulse"></div>
                            <div className="w-20 h-36 bg-white/20 rounded-t-lg animate-pulse"></div>
                            <div className="w-20 h-28 bg-white/20 rounded-t-lg animate-pulse"></div>
                        </div>
                    ) : (
                        <>
                            {topThree.length > 1 && <TopRankerCard user={topThree[1]} medalColor="bg-slate-400" icon="fa-medal" sizeClass="order-2" />}
                            {topThree.length > 0 && <TopRankerCard user={topThree[0]} medalColor="bg-yellow-400" icon="fa-trophy" sizeClass="order-1 scale-110 mb-4" />}
                            {topThree.length > 2 && <TopRankerCard user={topThree[2]} medalColor="bg-orange-400" icon="fa-medal" sizeClass="order-3" />}
                        </>
                    )}
                </div>
            </div>

            {/* Rest of the list */}
            <div className="p-4 space-y-3">
                 {isLoading ? (
                    Array.from({length: 5}).map((_, i) => (
                        <div key={i} className="flex items-center p-3 rounded-lg bg-white animate-pulse">
                            <div className="w-8 h-6 bg-gray-200 rounded"></div>
                            <div className="w-10 h-10 rounded-full mx-3 bg-gray-200"></div>
                            <div className="flex-grow h-6 bg-gray-200 rounded"></div>
                            <div className="w-20 h-6 bg-gray-200 rounded"></div>
                        </div>
                    ))
                 ) : rankings.length === 0 ? (
                    <div className="text-center p-8 text-gray-500">
                        <i className="fa-solid fa-ranking-star text-4xl mb-4"></i>
                        <p>The leaderboard is currently empty.</p>
                        <p className="text-sm">Be the first to get on the board!</p>
                    </div>
                 ) : (
                    others.map(user => (
                        <RankListItem key={user.uid} user={user} />
                    ))
                 )}
            </div>
        </div>
    );
};

export default RankScreen;
