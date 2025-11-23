
import React from 'react';
import { UserProfile } from '../types';

interface WalletScreenProps {
    userProfile: UserProfile;
    onWithdrawClick: () => void;
    onHistoryClick: () => void;
}

const POINTS_PER_DOLLAR = 100000;

const WalletScreen: React.FC<WalletScreenProps> = ({ userProfile, onWithdrawClick, onHistoryClick }) => {
    const balance = userProfile.points / POINTS_PER_DOLLAR;
    const points = userProfile.points;

    // Use the efficient aggregate stats from the user profile
    const pendingWithdrawals = userProfile.withdrawalStats?.pending || 0;
    const totalWithdrawn = userProfile.withdrawalStats?.completed || 0;

    const { directEarnings, commissionEarnings } = userProfile.referrals;

    return (
        <div className="p-4 md:p-6 pb-24 text-[var(--dark)] space-y-6">
            {/* Balance Card - Modified */}
            <div className="bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] rounded-2xl shadow-xl p-5 text-white">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-sm opacity-80">Balance:</p>
                        <p className="text-3xl font-bold">${balance.toFixed(2)}</p>
                        <p className="text-sm opacity-80 mt-1">{points.toLocaleString()} Points</p>
                    </div>
                    <div>
                         <button onClick={onWithdrawClick} className="flex items-center justify-center px-4 py-2 bg-white text-[var(--primary)] font-bold rounded-lg shadow-md hover:bg-gray-50 transition-all duration-300 transform hover:scale-105">
                            <i className="fa-solid fa-money-bill-transfer mr-2"></i>
                            <span>Withdraw</span>
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                {/* Pending Withdrawals Card */}
                <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-4 rounded-xl text-white shadow-lg">
                    <div className="flex items-center text-white/90 mb-1">
                        <i className="fa-solid fa-hourglass-half"></i>
                        <span className="font-semibold text-sm ml-2">Pending</span>
                    </div>
                    <p className="text-2xl font-bold">${pendingWithdrawals.toFixed(2)}</p>
                    {pendingWithdrawals === 0 && <p className="text-xs opacity-80">No pending withdrawals</p>}
                </div>

                {/* Total Withdrawn Card */}
                <div className="bg-gradient-to-br from-green-400 to-teal-500 p-4 rounded-xl text-white shadow-lg">
                     <div className="flex items-center text-white/90 mb-1">
                        <i className="fa-solid fa-check-circle"></i>
                        <span className="font-semibold text-sm ml-2">Withdrawn</span>
                    </div>
                    <p className="text-2xl font-bold">${totalWithdrawn.toFixed(2)}</p>
                </div>
            </div>

             {/* Referral Earnings */}
             <div className="bg-[var(--bg-card)] rounded-xl shadow-lg p-4 border border-[var(--border-color)] transition-colors">
                 <div className="flex items-center mb-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--bg-input)] flex items-center justify-center mr-4">
                         <i className="fa-solid fa-user-plus text-teal-500 text-xl"></i>
                    </div>
                    <h3 className="text-lg font-bold text-[var(--dark)]">Referral Earnings</h3>
                 </div>
                 <div className="flex justify-around text-center">
                    <div>
                        <p className="text-sm text-[var(--gray)]">Direct Bonus</p>
                        <p className="text-xl font-bold text-teal-600">${directEarnings.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-[var(--gray)]">Commissions</p>
                        <p className="text-xl font-bold text-teal-600">${commissionEarnings.toFixed(2)}</p>
                    </div>
                 </div>
             </div>

             {/* Withdrawal History */}
             <button 
                onClick={onHistoryClick}
                className="w-full bg-[var(--bg-card)] rounded-xl shadow-lg p-4 flex items-center justify-between text-left hover:bg-[var(--bg-card-hover)] transition-colors border border-[var(--border-color)]">
                <div>
                    <h3 className="font-bold text-lg text-[var(--dark)]">Withdrawal History</h3>
                    <p className="text-sm text-[var(--gray)] mt-1">View all your past withdrawal requests.</p>
                </div>
                <i className="fa-solid fa-clock-rotate-left text-2xl text-[var(--gray)]"></i>
             </button>

        </div>
    );
};

export default WalletScreen;
