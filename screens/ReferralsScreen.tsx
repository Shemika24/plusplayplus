
import React, { useState } from 'react';
import { UserProfile } from '../types';

interface ReferralsScreenProps {
    userProfile: UserProfile;
    onBack: () => void;
}

const StatCard: React.FC<{ icon: string; title: string; value: string; gradient: string; className?: string }> = ({ icon, title, value, gradient, className }) => (
    <div className={`p-4 rounded-xl text-white shadow-lg ${gradient} ${className}`}>
        <div className="flex items-center mb-2 opacity-90">
            <i className={`${icon} mr-2 text-lg`}></i>
            <span className="font-semibold text-sm">{title}</span>
        </div>
        <p className="text-3xl font-bold">{value}</p>
    </div>
);

const HowItWorksStep: React.FC<{ number: number; title: string; description: string; color: string }> = ({ number, title, description, color }) => (
    <div className="flex items-start space-x-4">
        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold shadow-md`} style={{backgroundColor: color}}>
            {number}
        </div>
        <div>
            <h4 className="font-bold text-[var(--dark)]">{title}</h4>
            <p className="text-sm text-[var(--gray)]">{description}</p>
        </div>
    </div>
);

const ReferralsScreen: React.FC<ReferralsScreenProps> = ({ userProfile, onBack }) => {
    const [copied, setCopied] = useState(false);
    const { referrals } = userProfile;

    // --- Telegram Referral Logic ---
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    const isTelegram = !!tgUser;
    
    let activeReferralLink = "";
    
    if (isTelegram && tgUser) {
        const botUsername = "plusplayplus_bot";
        activeReferralLink = `https://t.me/${botUsername}?start=${tgUser.id}`;
    } else {
        // Web Fallback
        activeReferralLink = `${window.location.origin}?ref=${userProfile.uid}`;
    }

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(activeReferralLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
            alert('Failed to copy link.');
        }
    };

    const handleShare = async () => {
        // 1. Telegram Native Share
        if (isTelegram && tgUser && window.Telegram?.WebApp?.openTelegramLink) {
            const shareText = `🎉 Hello! I'm ${tgUser.first_name} and I'm using this amazing app! Use my link to get a special bonus: ${activeReferralLink}`;
            const url = `https://t.me/share/url?url=${encodeURIComponent(activeReferralLink)}&text=${encodeURIComponent(shareText)}`;
            
            window.Telegram.WebApp.openTelegramLink(url);
            return;
        }

        // 2. Standard Web Share
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Join DYVERZE ADS!',
                    text: '🎉 Join this amazing site and start earning! Use my link to get a special bonus:',
                    url: activeReferralLink,
                });
            } catch (err) {
                console.error('Error sharing: ', err);
            }
        } else {
            handleCopy();
            alert('Link copied to clipboard! Share it with your friends.');
        }
    };

    return (
        <div className="flex flex-col h-full bg-[var(--gray-light)]">
            <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-card)] sticky top-0 z-10 flex items-center">
                <h1 className="text-lg font-bold text-[var(--dark)]">
                    Referrals
                </h1>
            </div>
            <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-32 space-y-6">
                {/* Stats Section */}
                <div className="grid grid-cols-2 gap-4">
                    <StatCard 
                        icon="fa-solid fa-dollar-sign" 
                        title="Direct Earnings" 
                        value={`$${referrals.directEarnings.toFixed(2)}`} 
                        gradient="bg-gradient-to-r from-green-400 to-teal-500"
                    />
                    <StatCard 
                        icon="fa-solid fa-percent" 
                        title="Commission Earnings" 
                        value={`$${referrals.commissionEarnings.toFixed(2)}`} 
                        gradient="bg-gradient-to-r from-orange-400 to-red-500"
                    />
                    <StatCard 
                        icon="fa-solid fa-users" 
                        title="Friends Invited" 
                        value={referrals.count.toString()}
                        gradient="bg-gradient-to-r from-blue-400 to-cyan-500"
                    />
                     <StatCard 
                        icon="fa-solid fa-user-check" 
                        title="Active Friends" 
                        value={referrals.activeCount.toString()}
                        gradient="bg-gradient-to-r from-purple-400 to-pink-500"
                    />
                </div>

                {/* How It Works Section */}
                <div className="bg-[var(--bg-card)] p-5 rounded-xl shadow-lg border border-[var(--border-color)]">
                    <h3 className="text-xl font-bold text-[var(--dark)] mb-4">How It Works</h3>
                    <div className="space-y-4">
                        <HowItWorksStep number={1} title="Invite a Friend" description="Share your unique link with friends." color="#82aaff" />
                        <HowItWorksStep number={2} title="Earn a Bonus" description="Get $0.10 for every friend who joins." color="#ffc98a" />
                        <HowItWorksStep number={3} title="Earn for Life" description="Receive 10% of their task earnings, forever! Commissions are added weekly." color="#ffb0c5" />
                    </div>
                </div>

                {/* Share Your Link Section */}
                <div className="bg-[var(--bg-card)] p-5 rounded-xl shadow-lg border border-[var(--border-color)]">
                    <h3 className="text-xl font-bold text-center text-[var(--dark)] mb-4">Share Your Link</h3>
                    <div className="w-full text-center bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg p-3 mb-4 text-[var(--gray)] font-mono text-sm break-all">
                        {activeReferralLink}
                    </div>
                    <button 
                        onClick={handleCopy}
                        className="w-full flex items-center justify-center bg-[var(--bg-input)] text-[var(--dark)] font-semibold py-3 rounded-lg mb-3 transition-colors hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)]"
                    >
                        <i className={`fa-solid ${copied ? 'fa-check' : 'fa-copy'} mr-2`}></i>
                        {copied ? 'Copied!' : 'Copy Link'}
                    </button>
                    <button
                        onClick={handleShare}
                        className="w-full flex items-center justify-center bg-sky-500 text-white font-bold py-3 rounded-lg transition-colors hover:bg-sky-600 shadow-md shadow-sky-500/30"
                    >
                        {isTelegram ? (
                            <><i className="fa-brands fa-telegram mr-2"></i> Share on Telegram</>
                        ) : (
                            <><i className="fa-solid fa-paper-plane mr-2"></i> Share</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReferralsScreen;
