
import React, { useState, useEffect } from 'react';
import DailyCheckinModal from '../components/modals/DailyCheckinModal';
import LuckyWheelModal from '../components/modals/LuckyWheelModal';
import Modal from '../components/Modal';
import { SpinWheelState, UserProfile, Screen } from '../types';
import { saveSpinResult, getUserProfile } from '../services/firestoreService';
import { getAuth } from 'firebase/auth';

interface EarnScreenProps {
    onNavigate: (screen: Screen) => void;
    onEarnPoints: (points: number, title: string, icon: string, iconColor: string) => void;
    userProfile?: UserProfile;
}

// Define the structure for an earning option
interface EarnOption {
    icon: string;
    iconColor: string;
    title: string;
    subtitle: string;
    disabled?: boolean;
}

// Array of earning options for the grid
const earnOptions: EarnOption[] = [
    {
        icon: 'fa-solid fa-calendar-check',
        iconColor: 'text-green-500',
        title: 'Daily Check-in',
        subtitle: 'Claim your daily reward',
        disabled: false,
    },
    {
        icon: 'fa-solid fa-dharmachakra',
        iconColor: 'text-purple-500',
        title: 'Lucky Wheel',
        subtitle: 'Spin & Win',
        disabled: false,
    },
    {
        icon: 'fa-solid fa-play-circle',
        iconColor: 'text-red-500',
        title: 'Watch Videos',
        subtitle: 'Start auto-ad session',
        disabled: true,
    },
    {
        icon: 'fa-solid fa-gamepad',
        iconColor: 'text-blue-500',
        title: 'Play Games',
        subtitle: 'Have Fun!',
        disabled: true,
    },
    {
        icon: 'fa-solid fa-user-plus',
        iconColor: 'text-orange-500',
        title: 'Invite Friends',
        subtitle: 'Earn $0.10 + 10% for life!',
        disabled: false,
    },
    {
        icon: 'fa-solid fa-star',
        iconColor: 'text-yellow-500',
        title: 'Special Offers',
        subtitle: 'Up to 1000 points',
        disabled: true,
    },
];

// Reusable card component for grid items
const EarnCard: React.FC<{ option: EarnOption; onClick: () => void; }> = ({ option, onClick }) => (
    <button 
        onClick={option.disabled ? undefined : onClick} 
        disabled={option.disabled}
        className={`relative bg-[var(--bg-card)] rounded-xl shadow-lg p-4 text-center flex flex-col items-center justify-center transform transition-all duration-300 h-full border border-[var(--border-color)] overflow-hidden
        ${option.disabled ? 'cursor-not-allowed opacity-90' : 'hover:scale-105 hover:border-[var(--primary)]'}
        `}
    >
        <i className={`${option.icon} ${option.iconColor} text-3xl mb-3`}></i>
        <h3 className="font-bold text-md text-[var(--dark)]">{option.title}</h3>
        <p className="text-xs text-[var(--gray)] mt-1 flex-grow">{option.subtitle}</p>

        {/* Overlay for disabled items */}
        {option.disabled && (
            <div className="absolute inset-0 bg-black/60 z-10 flex items-center justify-center backdrop-blur-[2px]">
                <div className="bg-white/10 border border-white/30 text-white px-3 py-1 rounded-lg transform -rotate-12 backdrop-blur-md shadow-xl">
                    <span className="text-xs font-bold uppercase tracking-widest">Coming Soon</span>
                </div>
            </div>
        )}
    </button>
);


const EarnScreen: React.FC<EarnScreenProps> = ({ onNavigate, onEarnPoints, userProfile }) => {
    const [isDailyCheckinOpen, setDailyCheckinOpen] = useState(false);
    const [isLuckyWheelOpen, setLuckyWheelOpen] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [spinWheelState, setSpinWheelState] = useState<SpinWheelState>({
        spinsToday: 0,
        winsToday: 0,
        lossesToday: 0,
    });
    const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);

    const fetchUserData = async () => {
        const auth = getAuth();
        if (auth.currentUser) {
            const profile = await getUserProfile(auth.currentUser);
            if (profile) {
                setCurrentUserProfile(profile);
                const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
                if (profile.spinStats && profile.spinStats.lastDate === todayStr) {
                    setSpinWheelState({
                        spinsToday: profile.spinStats.count,
                        winsToday: profile.spinStats.wins,
                        lossesToday: profile.spinStats.losses,
                    });
                } else {
                    setSpinWheelState({
                        spinsToday: 0,
                        winsToday: 0,
                        lossesToday: 0,
                    });
                }
            }
        }
    };

    useEffect(() => {
        if (userProfile) {
            setCurrentUserProfile(userProfile);
        } else {
            fetchUserData();
        }
    }, [userProfile, isLuckyWheelOpen]);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const getInitialTime = () => {
        // 7 days in seconds
        const sevenDaysInSeconds = 7 * 24 * 60 * 60;
        return sevenDaysInSeconds;
    };
    
    const [timeLeft, setTimeLeft] = useState(getInitialTime());

    useEffect(() => {
        if (timeLeft <= 0) return;
        const intervalId = setInterval(() => setTimeLeft(timeLeft - 1), 1000);
        return () => clearInterval(intervalId);
    }, [timeLeft]);

    const formatTime = (totalSeconds: number) => {
        const days = Math.floor(totalSeconds / (3600 * 24));
        const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        const pad = (num: number) => num.toString().padStart(2, '0');
        
        // Show Days if > 0
        if (days > 0) {
             return `${days}d ${pad(hours)}h ${pad(minutes)}m`;
        }
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    };

    const handleCardClick = (title: string) => {
        if (title === 'Daily Check-in') {
            setDailyCheckinOpen(true);
        } else if (title === 'Lucky Wheel') {
            fetchUserData().then(() => setLuckyWheelOpen(true));
        } else if (title === 'Special Offers') {
            onNavigate('SpecialOffers');
        } else if (title === 'Invite Friends') {
            onNavigate('Referrals');
        }
    };
    
    const handleSpinComplete = async (prize: number | string) => {
        const auth = getAuth();
        if (!auth.currentUser) return;

        const points = typeof prize === 'number' ? prize : 0;
        const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });

        setSpinWheelState(prevState => ({
            spinsToday: prevState.spinsToday + 1,
            winsToday: points > 0 ? prevState.winsToday + 1 : prevState.winsToday,
            lossesToday: points === 0 ? prevState.lossesToday + 1 : prevState.lossesToday,
        }));

        try {
            const updatedProfile = await saveSpinResult(auth.currentUser.uid, points, todayStr);
            setCurrentUserProfile(updatedProfile);
            
            if (points > 0) {
                onEarnPoints(points, 'Lucky Wheel Win', 'fa-solid fa-dharmachakra', 'text-purple-500');
            }
        } catch (error) {
            console.error("Failed to save spin:", error);
            fetchUserData();
        }
    };

    return (
        <div className="flex flex-col h-full p-4 md:p-6 pb-32 text-[var(--dark)]">
            <h2 className="text-xl font-bold text-[var(--dark)] mb-4 px-2 flex-shrink-0">Explore &amp; Earn</h2>
            
            <div className="grid grid-cols-2 gap-4 flex-grow">
                {earnOptions.map((option) => (
                    <EarnCard key={option.title} option={option} onClick={() => handleCardClick(option.title)} />
                ))}
            </div>

            {/* Unique Offer Section with Overlay */}
            <div className="relative mt-4 flex-shrink-0 rounded-xl overflow-hidden shadow-xl">
                <div className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white p-4 text-center filter blur-[1px]">
                     <div className="flex items-center justify-center mb-2">
                        <i className="fa-solid fa-fire text-yellow-300 text-lg mr-2"></i>
                        <h3 className="font-extrabold text-md">Unique Offer!</h3>
                     </div>
                     <p className="text-xs mb-3">Complete a special task and get <span className="font-bold">$0.50 extra!</span></p>
                     <div className="bg-white/20 rounded-full px-3 py-1.5 inline-flex items-baseline space-x-2">
                         <p className="text-xs opacity-80 font-medium">Expires in:</p>
                         <p className="font-mono text-sm font-bold tracking-wider">
                             {formatTime(timeLeft)}
                         </p>
                     </div>
                </div>

                {/* Overlay for Unique Offer */}
                <div className="absolute inset-0 bg-black/60 z-10 flex items-center justify-center backdrop-blur-[1px]">
                    <div className="bg-white/10 border border-white/30 text-white px-4 py-2 rounded-lg backdrop-blur-md shadow-xl">
                         <span className="text-sm font-bold uppercase tracking-widest">Coming Soon</span>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={isDailyCheckinOpen}
                onClose={() => setDailyCheckinOpen(false)}
                title="Daily Check-in"
            >
                <DailyCheckinModal 
                    onClose={() => setDailyCheckinOpen(false)} 
                    onEarnPoints={onEarnPoints} 
                    userProfile={currentUserProfile || undefined}
                />
            </Modal>

            <LuckyWheelModal
                isOpen={isLuckyWheelOpen}
                onClose={() => setLuckyWheelOpen(false)}
                spinWheelState={spinWheelState}
                onSpinComplete={handleSpinComplete}
                isOnline={isOnline}
            />
        </div>
    );
};

export default EarnScreen;
