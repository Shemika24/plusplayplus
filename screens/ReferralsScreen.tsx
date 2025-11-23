import React, { useMemo, useState } from 'react';
import { ReferralsScreenProps } from '../types';
import InvitedFriendsModal from '../components/modals/InvitedFriendsModal';

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; color: string; }> = ({ icon, label, value, color }) => (
    <div className={`w-full p-4 rounded-2xl text-white text-center shadow-lg ${color}`}>
        <div className="text-3xl mb-1">{icon}</div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm font-medium opacity-80">{label}</div>
    </div>
);


const ReferralsScreen: React.FC<ReferralsScreenProps> = ({ onBack, referralCount, referralEarnings, user, invitedFriends }) => {
    const [showInvitedModal, setShowInvitedModal] = useState(false);

    const referralLink = useMemo(() => {
        if (!user?.id) return '';
        const botUsername = "ShemiKash_bot";
        return `https://t.me/${botUsername}?start=${user.id}`;
    }, [user]);

    const handleCopyLink = () => {
        if (!referralLink) return;
        navigator.clipboard.writeText(referralLink).then(() => {
            alert('Referral link copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy link: ', err);
            alert('Could not copy link.');
        });
    };

    const handleShare = () => {
        if (!referralLink) return;
        const text = `🎉 Join this amazing bot and start earning! Use my link to get a special bonus:`;
        const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`;
        if (window.Telegram?.WebApp) {
            window.Telegram.WebApp.openTelegramLink(shareUrl);
        } else {
            handleCopyLink(); // Fallback for non-Telegram env
        }
    };
    
    return (
        <>
            <div className="animate-fadeIn space-y-6">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 -ml-2 text-dark hover:text-primary"><i className="fa-solid fa-arrow-left text-2xl"></i></button>
                    <h1 className="text-2xl font-bold text-dark">Your Referrals</h1>
                </div>
                
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-dark">Your Stats</h2>
                     <div className="grid grid-cols-2 gap-4">
                        <StatCard icon={<i className="fa-solid fa-dollar-sign"></i>} label="Direct Earnings" value={`$${referralEarnings.direct.toFixed(2)}`} color="bg-gradient-to-br from-success to-green-400" />
                        <StatCard icon={<i className="fa-solid fa-percent"></i>} label="Commission Earnings" value={`$${referralEarnings.commission.toFixed(2)}`} color="bg-gradient-to-br from-secondary to-accent-secondary" />
                    </div>
                    <button onClick={() => setShowInvitedModal(true)} className="w-full transition-transform hover:scale-105 active:scale-100 text-left">
                         <StatCard icon={<i className="fa-solid fa-users"></i>} label="Friends Invited" value={referralCount.total} color="bg-gradient-to-br from-primary to-accent" />
                    </button>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-md space-y-4">
                    <h2 className="text-xl font-bold text-dark text-center">How It Works</h2>
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">1</div>
                        <div>
                            <h3 className="font-bold text-dark">Invite a Friend</h3>
                            <p className="text-sm text-gray">Share your unique link with friends.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center font-bold text-lg">2</div>
                        <div>
                            <h3 className="font-bold text-dark">Earn a Bonus</h3>
                            <p className="text-sm text-gray">Get <span className="font-bold">$0.10</span> for every friend who joins.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-success/10 text-success flex items-center justify-center font-bold text-lg">3</div>
                        <div>
                            <h3 className="font-bold text-dark">Earn for Life</h3>
                            <p className="text-sm text-gray">Receive <span className="font-bold">10%</span> of their task earnings, forever! Commissions are added weekly.</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-md text-center space-y-4">
                    <h2 className="text-xl font-bold text-dark">Share Your Link</h2>
                    {referralLink ? (
                        <div className="bg-gray-light p-3 rounded-lg text-sm text-dark font-mono break-words">
                            {referralLink}
                        </div>
                    ) : (
                         <div className="bg-gray-light p-3 rounded-lg text-sm text-gray font-mono">
                            Loading your link...
                        </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-4">
                         <button onClick={handleCopyLink} disabled={!referralLink} className="w-full flex-1 bg-gray-200 text-dark font-bold py-3 rounded-xl transition-colors hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">
                            <i className="fa-solid fa-copy mr-2"></i>
                            Copy Link
                        </button>
                        <button onClick={handleShare} disabled={!referralLink} className="w-full flex-1 bg-sky-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-sky-500/30 transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">
                            <i className="fa-brands fa-telegram mr-2"></i>
                            Share
                        </button>
                    </div>
                </div>
            </div>
            <InvitedFriendsModal 
                isOpen={showInvitedModal}
                onClose={() => setShowInvitedModal(false)}
                friends={invitedFriends}
            />
        </>
    );
};

export default ReferralsScreen;