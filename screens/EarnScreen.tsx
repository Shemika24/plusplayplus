
import React, { useState, useEffect } from 'react';
import DailyCheckinModal from '../components/modals/DailyCheckinModal';
import LuckyWheelModal from '../components/modals/LuckyWheelModal';
import DailyComboModal from '../components/modals/DailyComboModal';
import Modal from '../components/Modal';
import { SpinWheelState } from '../types';

interface EarnScreenProps {
    onNavigateToReferrals: () => void;
    onEarnPoints: (points: number, title: string, icon: string, iconColor: string) => void;
}

// Define the structure for an earning option
interface EarnOption {
    icon: string;
    iconColor: string;
    title: string;
    subtitle: string;
}

// Array of earning options for the grid
const earnOptions: EarnOption[] = [
    {
        icon: 'fa-solid fa-calendar-check',
        iconColor: 'text-green-500',
        title: 'Daily Check-in',
        subtitle: 'Claim your daily reward',
    },
    {
        icon: 'fa-solid fa-dharmachakra',
        iconColor: 'text-purple-500',
        title: 'Lucky Wheel',
        subtitle: 'Spin & Win',
    },
    {
        icon: 'fa-solid fa-play-circle',
        iconColor: 'text-red-500',
        title: 'Watch Videos',
        subtitle: 'Start auto-ad session',
    },
    {
        icon: 'fa-solid fa-gamepad',
        iconColor: 'text-blue-500',
        title: 'Play Games',
        subtitle: 'Have Fun!',
    },
    {
        icon: 'fa-solid fa-user-plus',
        iconColor: 'text-orange-500',
        title: 'Invite Friends',
        subtitle: 'Earn $0.10 + 10% for life!',
    },
    {
        icon: 'fa-solid fa-star',
        iconColor: 'text-yellow-500',
        title: 'Special Offers',
        subtitle: 'Up to 1000 points',
    },
];

// Reusable card component for grid items
const EarnCard: React.FC<{ option: EarnOption; onClick: () => void; }> = ({ option, onClick }) => (
    <button onClick={onClick} className="bg-white rounded-xl shadow-lg p-4 text-center flex flex-col items-center justify-center transform hover:scale-105 transition-transform duration-300 h-full">
        <i className={`${option.icon} ${option.iconColor} text-3xl mb-3`}></i>
        <h3 className="font-bold text-md text-[var(--dark)]">{option.title}</h3>
        <p className="text-xs text-[var(--gray)] mt-1 flex-grow">{option.subtitle}</p>
    </button>
);


const EarnScreen: React.FC<EarnScreenProps> = ({ onNavigateToReferrals, onEarnPoints }) => {
    // Modal states
    const [isDailyCheckinOpen, setDailyCheckinOpen] = useState(false);
    const [isLuckyWheelOpen, setLuckyWheelOpen] = useState(false);
    const [isDailyComboOpen, setDailyComboOpen] = useState(false);

    // Online status
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // Spin wheel state
    const [spinWheelState, setSpinWheelState] = useState<SpinWheelState>({
        spinsToday: 0,
        winsToday: 0,
        lossesToday: 0,
    });

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

    // Countdown timer logic
    const getInitialTime = () => {
        const eightHoursInSeconds = 8 * 60 * 60;
        return eightHoursInSeconds;
    };
    
    const [timeLeft, setTimeLeft] = useState(getInitialTime());

    useEffect(() => {
        if (timeLeft <= 0) return;
        const intervalId = setInterval(() => setTimeLeft(timeLeft - 1), 1000);
        return () => clearInterval(intervalId);
    }, [timeLeft]);

    const formatTime = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const pad = (num: number) => num.toString().padStart(2, '0');
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    };

    const handleCardClick = (title: string) => {
        if (title === 'Daily Check-in') {
            setDailyCheckinOpen(true);
        } else if (title === 'Lucky Wheel') {
            setLuckyWheelOpen(true);
        } else if (title === 'Special Offers') {
            setDailyComboOpen(true);
        } else if (title === 'Invite Friends') {
            onNavigateToReferrals();
        }
    };
    
    const handleSpinComplete = (prize: number | string) => {
        setSpinWheelState(prevState => {
            const isWin = typeof prize === 'number';
            return {
                spinsToday: prevState.spinsToday + 1,
                winsToday: isWin ? prevState.winsToday + 1 : prevState.winsToday,
                lossesToday: !isWin ? prevState.lossesToday + 1 : prevState.lossesToday,
            };
        });
        if (typeof prize === 'number') {
            onEarnPoints(prize, 'Lucky Wheel Win', 'fa-solid fa-dharmachakra', 'text-purple-500');
        } else {
            console.log('User did not win this time.');
        }
    };

    return (
        <div className="flex flex-col h-full p-4 md:p-6 pb-24 text-[var(--dark)]">
            <h2 className="text-xl font-bold text-[var(--dark)] mb-4 px-2 flex-shrink-0">Explore &amp; Earn</h2>
            
            <div className="grid grid-cols-2 gap-4 flex-grow">
                {earnOptions.map((option) => (
                    <EarnCard key={option.title} option={option} onClick={() => handleCardClick(option.title)} />
                ))}
            </div>

            <div className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white rounded-xl shadow-xl p-4 text-center flex-shrink-0 mt-4">
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

            {/* --- Modals --- */}
            <Modal
                isOpen={isDailyCheckinOpen}
                onClose={() => setDailyCheckinOpen(false)}
                title="Daily Check-in"
            >
                <DailyCheckinModal onClose={() => setDailyCheckinOpen(false)} onEarnPoints={onEarnPoints} />
            </Modal>

            <LuckyWheelModal
                isOpen={isLuckyWheelOpen}
                onClose={() => setLuckyWheelOpen(false)}
                spinWheelState={spinWheelState}
                onSpinComplete={handleSpinComplete}
                isOnline={isOnline}
            />

            <DailyComboModal 
                isOpen={isDailyComboOpen}
                onClose={() => setDailyComboOpen(false)}
                onEarnPoints={onEarnPoints}
            />
        </div>
    );
};

export default EarnScreen;
