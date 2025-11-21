
import React, { useState, useEffect, useCallback, useRef } from 'react';
import InfoModal from '../modals/InfoModal';
import { playSound, vibrate, SOUNDS } from '../../utils/sound';
import { UserProfile } from '../../types';
import { claimDailyCheckIn } from '../../services/firestoreService';

// Define the structure for a single day in the check-in calendar
type DayStatus = 'claimed' | 'claimable' | 'future';

interface Day {
    day: number;
    status: DayStatus;
    icon: string;
    reward: number;
}

interface DailyCheckinModalProps {
    onClose: () => void;
    onEarnPoints: (points: number, title: string, icon: string, iconColor: string) => void;
    userProfile?: UserProfile;
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


const DayCard: React.FC<{ day: Day; onClaim: (day: number) => void; isLoading: boolean }> = ({ day, onClaim, isLoading }) => {
    let cardClasses = 'relative flex flex-col items-center justify-center p-1 rounded-lg aspect-square transition-all duration-300 overflow-hidden';
    let textClasses = '';
    let iconClasses = 'text-2xl mb-1';
    let dayLabelClasses = 'text-xs font-semibold';
    let overlay = null;

    const isClaimable = day.status === 'claimable';
    const isClaimed = day.status === 'claimed';
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
                <div className="absolute inset-0 bg-green-500 flex items-center justify-center z-10">
                    <i className="fa-solid fa-check text-white text-4xl"></i>
                </div>
            );
            break;
        case 'future':
        default:
            cardClasses += ' bg-gray-100 hover:bg-gray-200 cursor-pointer';
            textClasses = 'text-gray-400';
            iconClasses += ' text-gray-400';
            break;
    }

    return (
        <button 
            className={cardClasses} 
            onClick={() => isClaimable && !isLoading && onClaim(day.day)}
            disabled={isClaimed}
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

const DailyCheckinModal: React.FC<DailyCheckinModalProps> = ({ onClose, onEarnPoints, userProfile }) => {
    const [days, setDays] = useState<Day[]>(initialDaysData);
    const [claimedToday, setClaimedToday] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [claimedReward, setClaimedReward] = useState(0);
    
    // State to track which day is currently being processed
    const [processingDay, setProcessingDay] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState(15);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    
    // Info Modal State
    const [infoModal, setInfoModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'error' | 'info' | 'success' }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    });

    useEffect(() => {
        if (!userProfile) return;

        // Use server date formatted "YYYY-MM-DD" for consistency, strictly Africa/Maputo
        const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Maputo" }); 
        const lastClaimDateStr = userProfile.dailyCheckIn?.lastDate || "";
        const currentStreak = userProfile.dailyCheckIn?.streak || 0;

        let effectiveStreak = currentStreak;
        let hasClaimedToday = lastClaimDateStr === todayStr;

        // Naive check if streak is broken
        // Calculate "Yesterday" in Maputo Time
        const nowInMaputo = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Maputo" }));
        const yesterdayInMaputo = new Date(nowInMaputo);
        yesterdayInMaputo.setDate(yesterdayInMaputo.getDate() - 1);
        const yesterdayStr = yesterdayInMaputo.toLocaleDateString("en-CA");

        if (!hasClaimedToday && lastClaimDateStr !== yesterdayStr && lastClaimDateStr !== "") {
            effectiveStreak = 0;
        }
        
        // Reset streak if it's over 7 days
        if (effectiveStreak >= 7) {
            effectiveStreak = 0;
        }

        setClaimedToday(hasClaimedToday);
        
        const nextClaimableDay = hasClaimedToday ? effectiveStreak : effectiveStreak + 1;

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
    }, [userProfile]);

    // Timer Logic for 15s flow
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        
        if (isTimerRunning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => {
                    const newVal = prev - 1;
                    // Sound at 14s (when 1s is left)
                    if (newVal === 1) {
                         playSound(SOUNDS.SUCCESS);
                    }
                    // Vibrate at 15s end (when 0s left)
                    if (newVal === 0) {
                        vibrate(200);
                        handleRewardGrant(); // Grant reward when time is up
                    }
                    return newVal;
                });
            }, 1000);
        }
        
        return () => clearInterval(interval);
    }, [isTimerRunning, timeLeft]);

    const handleRewardGrant = async () => {
        if (processingDay === null || !userProfile) return;
        setIsTimerRunning(false);

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

        try {
            const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Maputo" });
            // Calculate new streak
            const currentStreak = userProfile.dailyCheckIn?.streak || 0;
            const newStreak = (currentStreak >= 7) ? 1 : currentStreak + 1;

            // Server sync
            await claimDailyCheckIn(userProfile.uid, finalReward, todayStr, newStreak);

            setClaimedReward(finalReward);
            onEarnPoints(finalReward, `Daily Check-in: Day ${dayToClaim.day}`, dayToClaim.icon, isSurpriseDay ? 'text-pink-400' : 'text-yellow-400');

            setDays(prevDays => prevDays.map(d => 
                d.day === processingDay 
                ? { ...d, status: 'claimed', reward: finalReward } 
                : d
            ));
            setClaimedToday(true);
            setShowSuccess(true);
            
            setTimeout(() => {
                onClose();
            }, 3000);
            
        } catch (e: any) {
            setInfoModal({ isOpen: true, title: "Error", message: e.message || "Failed to claim reward.", type: 'error' });
            setIsTimerRunning(false);
            setProcessingDay(null);
        }
    };

    const handleDayClick = async (dayNumber: number) => {
        if (claimedToday || processingDay !== null) return;
        
        // Check for user profile first to avoid issues
        if (!userProfile) {
             setInfoModal({ isOpen: true, title: "Error", message: "User profile not loaded. Please try again.", type: 'error' });
             return;
        }

        setProcessingDay(dayNumber);
        setTimeLeft(15);
        setIsTimerRunning(true);

        // Trigger Ad (Interstitial) - Fire and forget, or await if we wanted to pause timer?
        // Request says "time based on 15s". We start timer AND show ad.
        if (window.show_10206331) {
            window.show_10206331().then(() => {
                console.log("Ad closed by user.");
                // We don't grant reward here, we wait for timer (15s) to finish.
            }).catch(e => {
                console.warn("Ad failed to load/show", e);
                // We allow the timer to continue even if ad fails? 
                // Usually yes to not block user, or we could show error.
            });
        } else {
            console.warn("Ad SDK not ready");
        }
    };

    const infoText = claimedToday
        ? 'You have already claimed today. Come back tomorrow!'
        : "";

    return (
        <div className="p-4 md:p-6 relative">
            {/* Success Overlay - Semi-transparent as requested previously for result */}
            {showSuccess && (
                 <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-xl animate-fadeIn">
                    <div className="bg-white/90 p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full relative overflow-hidden transform transition-all scale-100 border border-white/50">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-blue-400/10 pointer-events-none"></div>
                        <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6 border-4 border-green-200 animate-bounce relative z-10">
                            <i className="fa-solid fa-gift text-green-500 text-5xl"></i>
                        </div>
                        <h3 className="text-3xl font-extrabold text-gray-800 mb-2 relative z-10">Checked In!</h3>
                        <p className="text-gray-600 relative z-10 text-lg">
                            You earned <span className="font-bold text-green-600 text-xl">+{claimedReward}</span> points!
                        </p>
                    </div>
                </div>
            )}

            {/* Processing Overlay */}
            {processingDay !== null && !showSuccess && (
                <div className="absolute inset-0 z-20 bg-white/90 flex flex-col items-center justify-center rounded-xl">
                     <div className="w-20 h-20 mb-6 relative flex items-center justify-center">
                        <svg className="animate-spin h-full w-full text-[var(--primary)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="absolute font-bold text-2xl text-[var(--dark)]">{timeLeft}</span>
                    </div>
                    <p className="font-bold text-lg text-gray-700 animate-pulse">Checking In...</p>
                    <p className="text-sm text-gray-500 mt-2">Please wait for verification.</p>
                </div>
            )}

            <div className="grid grid-cols-4 gap-3 mb-4">
                {days.map(day => (
                    <DayCard 
                        key={day.day} 
                        day={day} 
                        onClaim={handleDayClick} 
                        isLoading={processingDay !== null}
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
