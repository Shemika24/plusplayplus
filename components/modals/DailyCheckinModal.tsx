
import React, { useState, useEffect, useRef } from 'react';
import { playSound, vibrate, SOUNDS } from '../../utils/sound';
import { UserProfile } from '../../types';
import { claimDailyCheckIn } from '../../services/firestoreService';
import { useRewardedAd } from '../../hooks/useRewardedAd';

interface DailyCheckinModalProps {
    onClose: () => void;
    onEarnPoints: (points: number, title: string, icon: string, iconColor: string) => void;
    userProfile?: UserProfile;
}

const DAYS_CONFIG = [
    { day: 1, reward: 75, icon: 'fa-coins' },
    { day: 2, reward: 100, icon: 'fa-coins' },
    { day: 3, reward: 150, icon: 'fa-coins' },
    { day: 4, reward: 200, icon: 'fa-coins' },
    { day: 5, reward: 300, icon: 'fa-coins' },
    { day: 6, reward: 500, icon: 'fa-coins' },
    { day: 7, reward: 0, icon: 'fa-gift', isSurprise: true },
];

const DailyCheckinModal: React.FC<DailyCheckinModalProps> = ({ onClose, onEarnPoints, userProfile }) => {
    // --- State ---
    const [days, setDays] = useState(DAYS_CONFIG.map(d => ({ ...d, status: 'future' })));
    const [showSuccess, setShowSuccess] = useState(false);
    const [wonAmount, setWonAmount] = useState(0);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [pendingDayIndex, setPendingDayIndex] = useState<number | null>(null);

    // --- Date & Status Logic ---
    const getTodayStr = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
    const getYesterdayStr = () => {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return d.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
    };

    useEffect(() => {
        if (!userProfile) return;

        const todayStr = getTodayStr();
        const yesterdayStr = getYesterdayStr();
        const lastDate = userProfile.dailyCheckIn?.lastDate || "";
        let rawStreak = userProfile.dailyCheckIn?.streak || 0;
        const isAlreadyClaimed = lastDate === todayStr;

        // Visual Reset Check: If last check-in was NOT yesterday and NOT today, 
        // the streak is effectively broken for visual purposes (it will reset to 1 on claim).
        // So we should treat rawStreak as 0 for the UI rendering.
        if (lastDate && lastDate !== yesterdayStr && lastDate !== todayStr) {
            rawStreak = 0;
        }

        // Calculate the start of the current 7-day cycle.
        const cycleBase = Math.floor((rawStreak - (isAlreadyClaimed ? 1 : 0)) / 7) * 7;

        setDays(DAYS_CONFIG.map((d, index) => {
            const dayAbsoluteNumber = cycleBase + index + 1;

            if (dayAbsoluteNumber <= rawStreak) {
                return { ...d, status: 'claimed' };
            }
            
            if (dayAbsoluteNumber === rawStreak + 1 && !isAlreadyClaimed) {
                return { ...d, status: 'current' };
            }

            return { ...d, status: 'future' };
        }));

    }, [userProfile]);

    // --- Ad Hook Implementation ---
    const executeClaim = async () => {
        if (!userProfile) return;

        try {
            // New signature: No longer passing streak/reward. Backend calculates reset.
            const { reward } = await claimDailyCheckIn(userProfile.uid);
            
            // Success!
            handleSuccess(reward);
        } catch (err: any) {
            console.error(err);
            if (err.message && err.message.includes("Already checked in")) {
                setErrorMsg("Already checked in today!");
            } else {
                setErrorMsg("Connection error. Please try again.");
            }
        }
    };

    const { showRewardedAd, cancelAd, isAdActive, timeLeft, isLoading: isAdLoading } = useRewardedAd({
        minViewTimeSeconds: 15, // Standard duration for Interstitial
        maxViewTimeSeconds: 15,
        adType: 'Interstitial', // This triggers show_10206331() without args
        onReward: () => {
             executeClaim();
        },
        onError: (err) => {
            setErrorMsg("Ad failed. Please try again.");
            setPendingDayIndex(null);
        }
    });

    const handleStartClaim = (dayIndex: number) => {
        const targetDay = days[dayIndex];
        // Only allow clicking if status is strictly 'current'
        if (targetDay.status !== 'current' || isAdActive || isAdLoading) return;

        setPendingDayIndex(dayIndex);
        setErrorMsg(null);
        showRewardedAd();
    };

    const handleSuccess = (reward: number) => {
        playSound(SOUNDS.SUCCESS);
        vibrate(200);
        setWonAmount(reward);
        setShowSuccess(true);
        setPendingDayIndex(null);
        
        // Notify Parent
        onEarnPoints(reward, 'Daily Check-in', 'fa-solid fa-calendar-check', 'text-green-500');

        setTimeout(() => {
            onClose();
        }, 2500);
    };

    return (
        <div className="p-3 relative select-none">
             {/* BLOCKING OVERLAY for Ad / Processing */}
             {(isAdActive || isAdLoading) && (
                 <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-fadeIn select-none">
                    <div className="w-20 h-20 mb-6 relative flex items-center justify-center">
                        <svg className="animate-spin h-full w-full text-white/30" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {isAdActive && <span className="absolute font-bold text-2xl text-white">{timeLeft}</span>}
                    </div>
                    
                    <p className="text-white/90 font-medium text-lg animate-pulse">
                        {isAdLoading ? "Loading Ad..." : "Verifying Check-in..."}
                    </p>
                    
                    <button 
                        onClick={() => cancelAd(false)}
                        className="mt-12 px-6 py-2 rounded-full border border-white/20 text-white/60 hover:bg-white/10 hover:text-white transition-all text-sm"
                    >
                        Cancel
                    </button>
                </div>
             )}

             {/* SUCCESS OVERLAY */}
             {showSuccess && (
                <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm rounded-xl animate-fadeIn">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2 animate-bounce">
                        <i className="fa-solid fa-check text-2xl text-green-600"></i>
                    </div>
                    <h2 className="text-xl font-bold text-green-600">+{wonAmount} Points</h2>
                    <p className="text-xs text-gray-500 mt-1">See you tomorrow!</p>
                </div>
            )}

             {errorMsg && (
                <div className="bg-red-100 text-red-600 text-xs p-2 rounded mb-2 text-center border border-red-200">
                    {errorMsg}
                </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-4 gap-2">
                {days.map((day, index) => {
                    const isClaimed = day.status === 'claimed';
                    const isCurrent = day.status === 'current';
                    const isSurprise = day.isSurprise;

                    return (
                        <button
                            key={index}
                            disabled={!isCurrent || isAdActive || isAdLoading}
                            onClick={() => handleStartClaim(index)}
                            className={`
                                relative aspect-square rounded-xl border-2 flex flex-col items-center justify-center p-1 transition-all duration-200
                                ${isClaimed 
                                    ? 'bg-green-50 border-green-200 opacity-80' 
                                    : isCurrent 
                                        ? 'bg-white border-[var(--primary)] shadow-md transform hover:scale-105 cursor-pointer' 
                                        : 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed'
                                }
                            `}
                        >
                            <span className={`text-[9px] font-bold uppercase mb-1 ${isCurrent ? 'text-[var(--primary)]' : 'text-gray-400'}`}>
                                Day {day.day}
                            </span>

                            <div className={`text-lg mb-1 ${isClaimed ? 'text-green-500' : isCurrent ? (isSurprise ? 'text-pink-500' : 'text-yellow-500') : 'text-gray-300'}`}>
                                <i className={`fa-solid ${isSurprise && !isClaimed ? 'fa-gift' : 'fa-coins'}`}></i>
                            </div>

                             {isClaimed ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-green-100/80 rounded-lg z-10">
                                    <i className="fa-solid fa-check text-green-600 text-lg"></i>
                                </div>
                            ) : (
                                <span className={`text-[10px] font-bold ${isCurrent ? 'text-[var(--dark)]' : 'text-gray-400'}`}>
                                    {isSurprise ? 'Surprise' : `+${day.reward}`}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
             <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default DailyCheckinModal;
