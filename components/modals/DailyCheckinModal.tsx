
import React, { useState, useEffect, useRef } from 'react';
import { playSound, vibrate, SOUNDS } from '../../utils/sound';
import { UserProfile } from '../../types';
import { claimDailyCheckIn } from '../../services/firestoreService';

interface DailyCheckinModalProps {
    onClose: () => void;
    onEarnPoints: (points: number, title: string, icon: string, iconColor: string) => void;
    userProfile?: UserProfile;
}

const DAYS_CONFIG = [
    { day: 1, reward: 50, icon: 'fa-coins' },
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
    const [isClaiming, setIsClaiming] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [showSuccess, setShowSuccess] = useState(false);
    const [wonAmount, setWonAmount] = useState(0);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Strict Lock Ref (Updates synchronously)
    const isClaimingRef = useRef(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // --- Date & Status Logic ---
    const getTodayStr = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });

    useEffect(() => {
        if (!userProfile) return;

        const todayStr = getTodayStr();
        const lastDate = userProfile.dailyCheckIn?.lastDate || "";
        const rawStreak = userProfile.dailyCheckIn?.streak || 0;
        const isAlreadyClaimed = lastDate === todayStr;

        // Calculate the start of the current 7-day cycle.
        // If we claimed today (isAlreadyClaimed), we act as if we are still in the cycle of the claim we just made (streak - 1).
        // If we haven't claimed, we use the current streak to see where we are.
        const cycleBase = Math.floor((rawStreak - (isAlreadyClaimed ? 1 : 0)) / 7) * 7;

        setDays(DAYS_CONFIG.map((d, index) => {
            // The absolute day number for this specific card in the sequence (e.g., Day 8, Day 9...)
            const dayAbsoluteNumber = cycleBase + index + 1;

            // LOGIC:
            // 1. If the absolute day number is <= the user's total streak, it is CLAIMED.
            if (dayAbsoluteNumber <= rawStreak) {
                return { ...d, status: 'claimed' };
            }
            
            // 2. If the absolute day number is exactly (streak + 1), AND we haven't claimed today, it is CURRENT.
            if (dayAbsoluteNumber === rawStreak + 1 && !isAlreadyClaimed) {
                return { ...d, status: 'current' };
            }

            // 3. Otherwise, it is in the FUTURE.
            return { ...d, status: 'future' };
        }));

        // If claimed today, lock ref immediately just in case
        if (isAlreadyClaimed) {
            isClaimingRef.current = true;
        } else {
            isClaimingRef.current = false;
        }

    }, [userProfile]);

    // --- Cleanup ---
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    // --- Handlers ---
    const handleStartClaim = (dayIndex: number) => {
        // 1. Strict Checks
        if (isClaimingRef.current || isClaiming) return;
        const targetDay = days[dayIndex];
        
        // Only allow clicking if status is strictly 'current'
        if (targetDay.status !== 'current') return;

        // 2. Lock & Update UI
        isClaimingRef.current = true;
        setIsClaiming(true);
        setCountdown(15);
        setErrorMsg(null);

        // 3. Load Ad (Fire & Forget)
        try {
             if ((window as any).show_10206331) (window as any).show_10206331();
        } catch (e) {}

        // 4. Start Timer
        timerRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    executeClaim(dayIndex);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const executeClaim = async (dayIndex: number) => {
        if (!userProfile) return;

        const dayConfig = days[dayIndex];
        let reward = dayConfig.reward;
        
        if (dayConfig.isSurprise) {
            // Surprise values: 1000, 1500, 2000, 3000, 4500, or 5000
            const possibleRewards = [1000, 1500, 2000, 3000, 4500, 5000];
            const randomIndex = Math.floor(Math.random() * possibleRewards.length);
            reward = possibleRewards[randomIndex];
        }

        const todayStr = getTodayStr();
        const newStreak = (userProfile.dailyCheckIn?.streak || 0) + 1;

        try {
            await claimDailyCheckIn(userProfile.uid, reward, todayStr, newStreak);
            
            // Success!
            handleSuccess(reward);

        } catch (err: any) {
            console.error(err);
            // Handle Race Condition: If backend says "Already checked in", treat as visual success
            if (err.message && err.message.includes("Already checked in")) {
                // Maybe they double clicked too fast or refreshed. Show success anyway to avoid confusion.
                handleSuccess(reward); 
            } else {
                // Genuine Error
                setIsClaiming(false);
                isClaimingRef.current = false;
                setErrorMsg("Connection error. Please try again.");
            }
        }
    };

    const handleSuccess = (reward: number) => {
        playSound(SOUNDS.SUCCESS);
        vibrate(200);
        setWonAmount(reward);
        setShowSuccess(true);
        setIsClaiming(false); // Visual loading stop, but ref stays true via "Already Claimed" logic in effect next render
        
        // Notify Parent (Points are already in DB, just visual update)
        onEarnPoints(reward, 'Daily Check-in', 'fa-solid fa-calendar-check', 'text-green-500');

        setTimeout(() => {
            onClose();
        }, 2500);
    };

    return (
        <div className="p-3 relative select-none">
             {/* BLOCKING OVERLAY for Timer */}
             {isClaiming && !showSuccess && (
                <div className="absolute inset-0 z-[60] bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl cursor-wait">
                     <div className="relative w-16 h-16 flex items-center justify-center">
                        <svg className="animate-spin w-full h-full text-[var(--primary)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="absolute text-sm font-bold text-[var(--dark)]">{countdown}s</span>
                    </div>
                    <p className="text-xs font-semibold text-[var(--primary)] mt-3 animate-pulse">Claiming Reward...</p>
                    <p className="text-[10px] text-gray-400 mt-1">Please do not close</p>
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
                            disabled={!isCurrent || isClaiming}
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
    