
import React, { useState } from 'react';
import { UserProfile } from '../types';

interface ReferFriendBonusScreenProps {
    userProfile: UserProfile;
    onNavigateToReferrals: () => void;
    onEarnPoints: (points: number, title: string, icon: string, iconColor: string) => void;
}

interface RewardTier {
    reward: number;
    invites: number;
    days: number;
}

const rewardTiers: RewardTier[] = [
    { reward: 0.5, invites: 10, days: 15 },
    { reward: 2, invites: 30, days: 30 },
    { reward: 5, invites: 50, days: 45 },
    { reward: 10, invites: 150, days: 30 },
    { reward: 20, invites: 250, days: 90 },
    { reward: 50, invites: 500, days: 30 },
    { reward: 75, invites: 1000, days: 180 },
    { reward: 100, invites: 5000, days: 60 },
    { reward: 150, invites: 10000, days: 365 },
    { reward: 300, invites: 20000, days: 365 },
];

const POINTS_PER_DOLLAR = 100000;

const CircularProgress: React.FC<{ progress: number }> = ({ progress }) => {
    const radius = 55; // Increased from 45 for a larger circle
    const stroke = 8;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <svg
            height={radius * 2}
            width={radius * 2}
            viewBox={`0 0 ${radius * 2} ${radius * 2}`}
            className="transform -rotate-90"
        >
             <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff9f43" />
                <stop offset="100%" stopColor="#ff6b9d" />
                </linearGradient>
            </defs>
            <circle
                stroke="rgba(255, 255, 255, 0.2)" // Increased opacity for better visibility on new background
                fill="transparent"
                strokeWidth={stroke}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
            />
            <circle
                stroke="url(#progressGradient)"
                fill="transparent"
                strokeWidth={stroke}
                strokeDasharray={circumference + ' ' + circumference}
                style={{ strokeDashoffset, strokeLinecap: 'round', transition: 'stroke-dashoffset 0.35s' }}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
            />
        </svg>
    );
};

const RewardCard: React.FC<{ tier: RewardTier; currentInvites: number; isClaimed: boolean; onClaim: (tier: RewardTier) => void; }> = ({ tier, currentInvites, isClaimed, onClaim }) => {
    const progress = Math.min((currentInvites / tier.invites) * 100, 100);
    const isClaimable = progress >= 100 && !isClaimed;

    return (
        <button 
            onClick={() => onClaim(tier)}
            disabled={!isClaimable}
            className={`bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] rounded-2xl p-4 text-center text-white flex flex-col items-center shadow-lg relative transition-transform duration-300
                ${isClaimable ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed'}
            `}
        >
            <i className="fa-solid fa-key absolute top-3 right-3 text-white/50 text-sm"></i>
            <div className="relative w-[110px] h-[110px] flex items-center justify-center my-2">
                <CircularProgress progress={progress} />
                <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold">${tier.reward.toLocaleString()}</span>
                </div>
            </div>
            <p className="font-semibold text-sm mt-2">
                {tier.invites >= 20000 ? `${tier.invites.toLocaleString()}+` : tier.invites.toLocaleString()} invites to unlock
            </p>
            <p className="text-xs text-white/70">({tier.days} active days)</p>
            
            {isClaimed && (
                <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center">
                    <i className="fa-solid fa-check text-white text-5xl"></i>
                </div>
            )}
        </button>
    );
};


const ReferFriendBonusScreen: React.FC<ReferFriendBonusScreenProps> = ({ userProfile, onNavigateToReferrals, onEarnPoints }) => {
    const [claimedTiers, setClaimedTiers] = useState<number[]>([]);
    const currentUserInvites = userProfile.referrals.count;

    const handleClaimReward = (tier: RewardTier) => {
        if (currentUserInvites >= tier.invites && !claimedTiers.includes(tier.invites)) {
            const pointsReward = tier.reward * POINTS_PER_DOLLAR;
            onEarnPoints(pointsReward, `Referral Bonus: ${tier.invites} invites`, 'fa-solid fa-users', 'text-sky-500');
            
            alert(`Congratulations! You've claimed a $${tier.reward} reward!`);
            
            // Add the tier's invite count to the claimed list
            setClaimedTiers(prev => [...prev, tier.invites]);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[var(--gray-light)]">
            <div className="p-4 bg-transparent sticky top-0 z-10 flex items-center justify-center text-[var(--dark)]">
                <h1 className="text-lg font-bold">
                    Referral Rewards
                </h1>
            </div>
            <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-32">
                <div className="grid grid-cols-2 gap-4">
                    {rewardTiers.map(tier => (
                        <RewardCard 
                            key={tier.reward} 
                            tier={tier} 
                            currentInvites={currentUserInvites} 
                            isClaimed={claimedTiers.includes(tier.invites)}
                            onClaim={handleClaimReward}
                        />
                    ))}
                </div>
                <div className="mt-6">
                    <button
                        onClick={onNavigateToReferrals}
                        className="w-full bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-sky-500/30 transition-all hover:scale-105 hover:brightness-110 active:scale-100"
                    >
                        <i className="fa-solid fa-user-plus mr-2"></i>
                        Invite Friends Now
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReferFriendBonusScreen;
