
import React, { useState, useEffect, useCallback } from 'react';
import { useRewardedAd } from '../../hooks/useRewardedAd';
import InfoModal from '../modals/InfoModal';

// Define the structure for a single day in the check-in calendar
type DayStatus = 'claimed' | 'claimable' | 'future';

interface Day {
    day: number;
    status: DayStatus;
    icon: string;
    reward: number;
}

// Updated reward values and icons
const initialDaysData: Day[] = [
    { day: 1, status: 'future', icon: 'fa-solid fa-coins', reward: 20 },
    { day: 2, status: 'future', icon: 'fa-solid fa-coins', reward: 35 },
    { day: 3, status: 'future', icon: 'fa-solid fa-coins', reward: 55 },
    { day: 4, status: 'future', icon: 'fa-solid fa-coins', reward: 100 },
    { day: 5, status: 'future', icon: 'fa-solid fa-coins', reward: 120 },
    { day: 6, status: 'future', icon: 'fa-solid fa-coins', reward: 135 },
    { day: 7, status: 'future', icon: 'fa-solid fa-gift', reward: 0 }, // Placeholder, value generated on claim
];

const STORAGE_KEY = 'dailyCheckinState';

const DayCard: React.FC<{ day: Day; onClaim: (day: number) => void; isLoading: boolean }> = ({ day, onClaim, isLoading }) => {
    let cardClasses = 'relative flex flex-col items-center justify-center p-1 rounded-lg aspect-square transition-all duration-300 overflow-hidden';
    let textClasses = '';
    let iconClasses = 'text-2xl mb-1';
    let dayLabelClasses = 'text-xs font-semibold';
    let overlay = null;

    const isClaimable = day.status === 'claimable';
    const isSurpriseDay = day.day === 7;
    
    const displayIcon = (isSurpriseDay && day.status === 'claimed') ? 'fa-solid fa-box-open' : day.icon;

    switch (day.status) {
        case 'claimable':
            cardClasses += ' bg-white border-2 border-[var(--primary)] cursor-pointer hover:shadow-lg hover:-translate-y-1';
            textClasses = 'text-[var(--primary)]';
            iconClasses += isSurpriseDay ? ' text-pink-400' : ' text-yellow-400';
            break;
        case 'claimed':
            cardClasses += ' bg-green-100 border-2 border-green-300';
            textClasses = 'text-green-700';
            iconClasses += ' text-green-500';
            overlay = (
                <div className="absolute inset-0 bg-green-500/70 rounded-lg flex items-center justify-center backdrop-blur-sm z-10">
                    <i className="fa-solid fa-check text-white text-4xl"></i>
                </div>
            );
            break;
        case 'future':
        default:
            cardClasses += ' bg-gray-100';
            textClasses = 'text-gray-400';
            iconClasses += ' text-gray-400';
            break;
    }

    return (
        <button 
            className={cardClasses} 
            onClick={() => isClaimable && !isLoading && onClaim(day.day)}
            disabled={!isClaimable || isLoading}
        >
            {overlay}
            {isLoading && isClaimable && (
                 <div className="absolute inset-0 bg-white/80 rounded-lg flex items-center justify-center z-20">
                    <i className="fa-solid fa-spinner fa-spin text-[var(--primary)] text-2xl"></i>
                </div>
            )}
            <p className={`${dayLabelClasses} ${textClasses}`}>Day {day.day}</p>
            <i className={`${displayIcon} ${iconClasses}`}></i>
            {isSurpriseDay && day.status !== 'claimed' ? (
                <p className={`font-bold text-xs ${textClasses}`}>Surprise!</p>
            ) : (
                <p className={`font-bold text-xs ${textClasses}`}>+{day.reward}</p>
            )}
        </button>
    );
}

const DailyCheckinModal: React.FC<{ onClose: () => void; onEarnPoints: (points: number, title: string, icon: string, iconColor: string) => void; }> = ({ onClose, onEarnPoints }) => {
    const [days, setDays] = useState<Day[]>(initialDaysData);
    const [claimedToday, setClaimedToday] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [claimedReward, setClaimedReward] = useState(0);
    
    // State to track which day is currently being processed
    const [processingDay, setProcessingDay] = useState<number | null>(null);
    
    // Info Modal State
    const [infoModal, setInfoModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'error' | 'info' | 'success' }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    });

    // Ad Logic Hooks
    const handleRewardSuccess = useCallback(() => {
        if (processingDay === null) return;
        
        const dayToClaim = days.find(d => d.day === processingDay);
        if (!dayToClaim) return;

        let finalReward = dayToClaim.reward;
        const isSurpriseDay = dayToClaim.day === 7;

        if (isSurpriseDay) {
            const min = 155;
            const max = 465;
            const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
            finalReward = Math.round(randomNumber / 5) * 5;
        }

        setClaimedReward(finalReward);
        const iconColor = isSurpriseDay ? 'text-pink-400' : 'text-yellow-400';
        onEarnPoints(finalReward, `Daily Check-in: Day ${dayToClaim.day}`, dayToClaim.icon, iconColor);

        const newState = {
            lastClaimedDay: processingDay,
            lastClaimedTimestamp: Date.now()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));

        setDays(prevDays => prevDays.map(d => 
            d.day === processingDay 
            ? { ...d, status: 'claimed', reward: finalReward } 
            : d
        ));
        setClaimedToday(true);
        setShowSuccess(true);
        
        setTimeout(() => {
            onClose();
        }, 2000);
        
        setProcessingDay(null);
    }, [days, processingDay, onEarnPoints, onClose]);

    const { 
        showRewardedAd, 
        cancelAd, 
        isLoading: isAdLoading, 
        isAdActive, 
        timeLeft: adTimeLeft 
    } = useRewardedAd({
        minViewTimeSeconds: 15, 
        maxViewTimeSeconds: 20,
        onReward: handleRewardSuccess,
        onError: (err) => setInfoModal({ isOpen: true, title: 'Error', message: "Could not load ad.", type: 'error' })
    });

    useEffect(() => {
        // Function to check if two dates are on the same calendar day
        const isSameDay = (d1: Date, d2: Date) => {
            return d1.getFullYear() === d2.getFullYear() &&
                d1.getMonth() === d2.getMonth() &&
                d1.getDate() === d2.getDate();
        };

        // Function to check if a date was yesterday
        const isYesterday = (d1: Date, d2: Date) => {
            const yesterday = new Date(d2);
            yesterday.setDate(d2.getDate() - 1);
            return isSameDay(d1, yesterday);
        };

        const rawState = localStorage.getItem(STORAGE_KEY);
        const storedState = rawState ? JSON.parse(rawState) : { lastClaimedDay: 0, lastClaimedTimestamp: 0 };
        
        const lastClaimDate = new Date(storedState.lastClaimedTimestamp);
        const today = new Date();

        let currentStreak = storedState.lastClaimedDay;
        let hasClaimedToday = false;

        if (storedState.lastClaimedTimestamp > 0) {
            if (isSameDay(lastClaimDate, today)) {
                hasClaimedToday = true;
            } else if (!isYesterday(lastClaimDate, today)) {
                // Streak broken
                currentStreak = 0;
            }
        }
        
        // Reset streak if it's over 7 days
        if (currentStreak >= 7) {
            currentStreak = 0;
        }

        setClaimedToday(hasClaimedToday);
        const nextClaimableDay = currentStreak + 1;

        const updatedDays = initialDaysData.map(day => {
            if (day.day < nextClaimableDay) {
                return { ...day, status: 'claimed' as DayStatus };
            }
            if (day.day === nextClaimableDay && !hasClaimedToday) {
                return { ...day, status: 'claimable' as DayStatus };
            }
            return { ...day, status: 'future' as DayStatus };
        });

        setDays(updatedDays);
    }, []);

    const handleDayClick = (dayNumber: number) => {
        if (claimedToday) return;
        setProcessingDay(dayNumber);
        showRewardedAd();
    };

    const infoText = claimedToday
        ? 'You have already claimed today. Come back tomorrow!'
        : "Watch a short ad to claim your daily reward!";

    if (showSuccess) {
        return (
            <div className="text-center p-6">
                <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4 border-4 border-green-200 animate-bounce">
                    <i className="fa-solid fa-gift text-green-500 text-4xl"></i>
                </div>
                <h3 className="text-2xl font-bold text-[var(--dark)] mb-2">Reward Claimed!</h3>
                <p className="text-[var(--gray)]">
                    You have received <span className="font-bold text-[var(--success)]">{claimedReward} bonus points</span>!
                </p>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-6 relative">
            {/* Ad Verification Overlay */}
            {isAdActive && (
                <div className="absolute inset-0 bg-white/95 z-50 flex flex-col items-center justify-center rounded-xl animate-fadeIn text-center p-4">
                     <div className="w-16 h-16 mb-4 relative flex items-center justify-center">
                         <svg className="animate-spin h-full w-full text-[var(--primary)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="absolute font-bold text-[var(--dark)] text-sm">{adTimeLeft}s</span>
                     </div>
                     <h3 className="text-lg font-bold text-[var(--dark)] mb-2">Checking Ad...</h3>
                     <p className="text-sm text-[var(--gray)] mb-6 max-w-[200px]">
                        Please verify the ad content for {adTimeLeft}s to claim reward.
                     </p>
                     <div className="w-full bg-gray-200 rounded-full h-2 mb-4 max-w-[200px]">
                        <div className="bg-[var(--primary)] h-2 rounded-full transition-all duration-1000 linear" style={{ width: `${((20 - adTimeLeft) / 20) * 100}%` }}></div>
                     </div>
                     <button onClick={() => cancelAd(false)} className="mt-4 text-sm text-[var(--gray)] hover:text-[var(--error)]">
                         Cancel & Close
                     </button>
                </div>
            )}

            <div className="grid grid-cols-4 gap-3 mb-4">
                {days.map(day => (
                    <DayCard 
                        key={day.day} 
                        day={day} 
                        onClaim={handleDayClick} 
                        isLoading={isAdLoading && processingDay === day.day}
                    />
                ))}
            </div>
            <p className="text-center text-sm text-[var(--gray)] h-5">
                {infoText}
            </p>
            
            <InfoModal
                isOpen={infoModal.isOpen}
                onClose={() => setInfoModal(prev => ({ ...prev, isOpen: false }))}
                title={infoModal.title}
                message={infoModal.message}
                type={infoModal.type}
                actions={[{ text: 'OK', onClick: () => setInfoModal(prev => ({ ...prev, isOpen: false })), primary: true }]}
            />
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .animate-fadeIn { animation: fadeIn 0.3s ease forwards; }
            `}</style>
        </div>
    );
};

export default DailyCheckinModal;
