
import React, { useState, useEffect, useMemo } from 'react';
import { SpinWheelState } from '../../types';
import Modal from '../Modal';
import { useRewardedAd } from '../../hooks/useRewardedAd';

// --- Sound Effects ---
const playSound = (src: string, volume: number = 1.0) => {
    try {
        const audio = new Audio(src);
        audio.volume = volume;
        audio.play().catch(() => {
            // Silently ignore playback errors as requested.
        });
    } catch (e) {
        // Silently ignore audio initialization errors.
    }
};

const vibrate = (pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
            navigator.vibrate(pattern);
        } catch (e) {
            // Ignore vibration errors
        }
    }
};

const SOUNDS = {
    SPIN_START: 'https://actions.google.com/sounds/v1/tools/clock_ticking.ogg',
    WIN: 'https://actions.google.com/sounds/v1/cartoon/magic_chime.ogg',
    LOSE: 'https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg',
    CLICK: 'https://actions.google.com/sounds/v1/ui/ui_tap_click_sharp.ogg',
};

// --- Component Interfaces ---
interface LuckyWheelModalProps {
    isOpen: boolean;
    onClose: () => void;
    spinWheelState: SpinWheelState;
    onSpinComplete: (prize: number | string) => void;
    isOnline: boolean;
}

interface Segment {
    value: number | string;
    colorClass: string;
    icon: React.ReactNode;
    name: string;
}

// --- Sub-Modals ---
const CongratsModal: React.FC<{ isOpen: boolean; prize: number; onClaim: () => void; }> = ({ isOpen, prize, onClaim }) => {
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(onClaim, 1000); // Auto-close after 1s
            return () => clearTimeout(timer);
        }
    }, [isOpen, onClaim]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[110] animate-fadeIn">
            <div className="bg-white p-6 rounded-2xl shadow-lg max-w-xs w-11/12 relative animate-slideInUp text-center">
                <i className="fa-solid fa-wand-magic-sparkles text-5xl mx-auto text-[var(--success)] mb-4"></i>
                <h3 className="text-xl font-bold text-[var(--dark)] mb-2">You Won!</h3>
                <p className="text-[var(--gray)]">
                    You've won <span className="font-bold text-[var(--dark)]">{prize}</span> points!
                </p>
            </div>
        </div>
    );
};

const LossModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(onClose, 1000); // Auto-close after 1s
            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose]);
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[110] animate-fadeIn">
            <div className="bg-white p-6 rounded-2xl shadow-lg max-w-xs w-11/12 relative animate-slideInUp text-center">
                <i className="fa-solid fa-face-frown-open text-5xl mx-auto text-[var(--error)] mb-4"></i>
                <h3 className="text-xl font-bold text-[var(--dark)] mb-2">Oops! Try Again!</h3>
                <p className="text-[var(--gray)]">
                    Better luck next time.
                </p>
            </div>
        </div>
    );
};


const SpinWheelInfoModal: React.FC<{ isOpen: boolean; onClose: () => void; segments: Segment[]; }> = ({ isOpen, onClose, segments }) => {
    if (!isOpen) return null;

    const uniqueSegments = useMemo(() => {
        const seen = new Set<string>();
        return segments.filter(segment => {
            if (seen.has(segment.name)) {
                return false;
            }
            seen.add(segment.name);
            return true;
        });
    }, [segments]);

    const sortedSegments = useMemo(() => {
        return [...uniqueSegments].sort((a, b) => {
            if (typeof a.value === 'string') return 1; // 'no_prize' goes to the end
            if (typeof b.value === 'string') return -1;
            return a.value - b.value;
        });
    }, [uniqueSegments]);

    const colorMap: { [key: string]: string } = { sky: 'bg-sky-500', slate: 'bg-slate-500', violet: 'bg-violet-500', rose: 'bg-rose-500', amber: 'bg-amber-500', lime: 'bg-lime-500', fuchsia: 'bg-fuchsia-500', teal: 'bg-teal-500' };
    const getColorClass = (classes: string) => {
        for (const key in colorMap) {
            if (classes.includes(key)) return colorMap[key];
        }
        return 'bg-gray-500';
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[110] animate-fadeIn" onClick={onClose}>
            <div className="bg-white p-6 rounded-2xl shadow-lg max-w-sm w-11/12 relative animate-slideInUp" onClick={e => e.stopPropagation()}>
                <button className="absolute top-4 right-4 text-[var(--gray)] hover:text-[var(--dark)]" onClick={onClose} aria-label="Close"><i className="fa-solid fa-xmark text-2xl"></i></button>
                <h2 className="text-2xl font-bold text-center text-[var(--dark)] mb-2">Wheel Prizes</h2>
                <p className="text-center text-[var(--gray)] text-sm mb-6">Here are the possible prizes you can win from the wheel.</p>
                
                <div className="grid grid-cols-4 gap-3">
                     {sortedSegments.map((segment, index) => (
                        <div key={index} className="flex flex-col items-center justify-center text-center gap-1 bg-gray-50 p-2 rounded-xl border border-gray-200">
                            <div className={`w-12 h-12 rounded-full ${getColorClass(segment.colorClass)} flex-shrink-0 flex items-center justify-center`}>
                                {segment.icon}
                            </div>
                            <p className="font-semibold text-xs text-center text-[var(--dark)] mt-1 h-8 flex items-center justify-center">{segment.name}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


const LuckyWheelModal: React.FC<LuckyWheelModalProps> = ({ isOpen, onClose, spinWheelState, onSpinComplete, isOnline }) => {
    const segments: Segment[] = useMemo(() => [
        { value: 100, colorClass: 'bg-gradient-to-br from-sky-400 to-blue-600', icon: <i className="fa-solid fa-coins text-white text-xl"></i>, name: '100 Points' },
        { value: 300, colorClass: 'bg-gradient-to-br from-teal-400 to-emerald-600', icon: <i className="fa-solid fa-gem text-white text-xl"></i>, name: '300 Points' },
        { value: 145, colorClass: 'bg-gradient-to-br from-violet-400 to-purple-600', icon: <i className="fa-solid fa-coins text-white text-xl"></i>, name: '145 Points' },
        { value: 155, colorClass: 'bg-gradient-to-br from-rose-400 to-red-600', icon: <i className="fa-solid fa-coins text-white text-xl"></i>, name: '155 Points' },
        { value: 200, colorClass: 'bg-gradient-to-br from-amber-400 to-orange-600', icon: <i className="fa-solid fa-star text-white text-xl"></i>, name: '200 Points' },
        { value: 'no_prize', colorClass: 'bg-gradient-to-br from-slate-400 to-gray-600', icon: <i className="fa-solid fa-face-meh text-white text-xl"></i>, name: 'No Prize' },
        { value: 45, colorClass: 'bg-gradient-to-br from-lime-400 to-green-600', icon: <i className="fa-solid fa-coins text-white text-xl"></i>, name: '45 Points' },
        { value: 55, colorClass: 'bg-gradient-to-br from-fuchsia-400 to-pink-600', icon: <i className="fa-solid fa-coins text-white text-xl"></i>, name: '55 Points' },
    ], []);

    const MAX_SPINS_PER_DAY = 10;
    const [targetWins] = useState(() => Math.floor(Math.random() * 3) + 5);

    const [isSpinning, setIsSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [result, setResult] = useState<number | string | null>(null);
    const [isInfoModalOpen, setInfoModalOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // --- Logic for the Actual Spin Mechanics ---
    const executeSpinLogic = () => {
        if (isSpinning || !isOnline || spinWheelState.spinsToday >= MAX_SPINS_PER_DAY) return;

        playSound(SOUNDS.SPIN_START, 0.5);
        setIsSpinning(true);
        setResult(null);

        // --- Controlled Randomness Logic ---
        const { winsToday, lossesToday } = spinWheelState;
        const targetLosses = MAX_SPINS_PER_DAY - targetWins;

        const winsRemaining = targetWins - winsToday;
        const lossesRemaining = targetLosses - lossesToday;
        
        let isWinResult: boolean;
        if (winsRemaining <= 0) {
            isWinResult = false; // Must be a loss
        } else if (lossesRemaining <= 0) {
            isWinResult = true; // Must be a win
        } else {
            isWinResult = Math.random() < winsRemaining / (winsRemaining + lossesRemaining);
        }

        const prizeSegments = segments.filter(s => typeof s.value === 'number');
        const lossSegments = segments.filter(s => s.value === 'no_prize');

        const winningSegment = isWinResult
            ? prizeSegments[Math.floor(Math.random() * prizeSegments.length)]
            : lossSegments[Math.floor(Math.random() * lossSegments.length)];
        
        const winningSegmentIndex = segments.findIndex(s => s === winningSegment);

        const segmentAngle = 360 / segments.length;
        const randomOffset = (segmentAngle / 2) - (Math.random() * segmentAngle * 0.8 + (segmentAngle * 0.1));
        const finalAngle = 360 - ((winningSegmentIndex * segmentAngle) + randomOffset);
        
        const totalRotation = 360 * 5 + finalAngle;
        setRotation(prev => prev + totalRotation);

        setTimeout(() => {
            const prize = segments[winningSegmentIndex].value;
            setResult(prize);
            onSpinComplete(prize);
            if (typeof prize === 'number') {
                playSound(SOUNDS.WIN, 0.8);
                // Win Vibration: 3 short pulses
                vibrate([100, 50, 100, 50, 100]);
            } else {
                playSound(SOUNDS.LOSE, 0.6);
                // Lose Vibration: One longer heavy pulse
                vibrate(300);
            }
        }, 4000);
    };

    // --- Ad Integration ---
    const { 
        showRewardedAd, 
        cancelAd, 
        preloadAd, 
        isLoading: isAdLoading, 
        isAdActive, 
        timeLeft: adTimeLeft 
    } = useRewardedAd({
        minViewTimeSeconds: 20,
        maxViewTimeSeconds: 35,
        onReward: (data) => {
            console.log(`Reward granted for tracking ID: ${data.trackingId}`);
            executeSpinLogic();
        },
        onError: (err: any) => {
            // Show a visible error inside the modal or an alert
            const msg = err?.message || "Could not load ad. Please try again.";
            setErrorMessage(msg);
            // Auto-clear error after 3 seconds
            setTimeout(() => setErrorMessage(null), 3000);
        }
    });

    useEffect(() => {
        if (isOpen) {
            preloadAd(); // Preload when modal opens
        }
    }, [isOpen, preloadAd]);


    const handleSpinClick = () => {
        if (isSpinning || !isOnline || spinWheelState.spinsToday >= MAX_SPINS_PER_DAY) return;
        setErrorMessage(null);
        showRewardedAd();
    };

    const handleCloseResultModal = () => {
        setResult(null);
        setIsSpinning(false);
    };

    const handleOpenInfo = () => {
        playSound(SOUNDS.CLICK, 0.7);
        setInfoModalOpen(true);
    }
    
    if (!isOpen) return null;

    const spinsLeft = MAX_SPINS_PER_DAY - spinWheelState.spinsToday;
    const canSpin = !isSpinning && isOnline && spinsLeft > 0 && !isAdLoading && !isAdActive;

    return (
        <>
            <Modal isOpen={isOpen} onClose={isSpinning || isAdActive ? () => {} : onClose} title="Lucky Wheel">
                <div className="p-4 md:p-6 relative overflow-hidden">
                    
                    {/* Ad Viewing Overlay */}
                    {isAdActive && (
                        <div className="absolute inset-0 bg-white/95 z-50 flex flex-col items-center justify-center rounded-xl animate-fadeIn text-center p-6">
                            <div className="w-16 h-16 mb-4 relative flex items-center justify-center">
                                <svg className="animate-spin h-full w-full text-[var(--primary)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="absolute font-bold text-[var(--dark)] text-lg">{adTimeLeft}s</span>
                            </div>
                            <h3 className="text-xl font-bold text-[var(--dark)] mb-2">Ad in Progress</h3>
                            <p className="text-sm text-[var(--gray)] mb-4">
                                Please keep the ad window open for <span className="font-bold text-[var(--primary)]">{adTimeLeft}s</span>.
                            </p>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6 max-w-xs">
                                <div className="bg-[var(--primary)] h-2.5 rounded-full transition-all duration-1000 ease-linear" style={{ width: `${((35 - adTimeLeft) / 35) * 100}%` }}></div>
                            </div>
                            <button 
                                onClick={() => cancelAd(false)}
                                className="px-6 py-2 bg-red-100 text-red-600 rounded-lg font-semibold text-sm hover:bg-red-200 transition-colors"
                            >
                                <i className="fa-solid fa-xmark mr-2"></i>
                                Cancel & Close
                            </button>
                        </div>
                    )}

                    {/* Error Toast */}
                    {errorMessage && (
                        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-11/12 bg-red-500 text-white text-sm py-2 px-4 rounded-lg shadow-lg z-40 animate-fadeIn text-center">
                            <i className="fa-solid fa-circle-exclamation mr-2"></i>
                            {errorMessage}
                        </div>
                    )}

                    <div className="relative w-64 h-64 mx-auto mb-6">
                        {/* Wheel Pointer */}
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20" style={{ filter: 'drop-shadow(0 4px 3px rgba(0,0,0,0.3))' }}>
                            <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[25px] border-t-yellow-400"></div>
                        </div>

                        {/* The Wheel */}
                        <div
                            className="w-full h-full rounded-full border-8 border-white shadow-xl transition-transform duration-[4000ms] ease-out"
                            style={{
                                transform: `rotate(${rotation}deg)`,
                                background: `conic-gradient(
                                    from 0deg,
                                    ${segments.map((s, i) => `${s.colorClass.replace('bg-gradient-to-br from-', '').split(' to-')[0]} ${i * 45}deg ${(i + 1) * 45}deg`).join(', ')}
                                )`
                            }}
                        >
                            {segments.map((segment, index) => (
                                <div
                                    key={index}
                                    className="absolute w-1/2 h-1/2 top-0 left-0 origin-bottom-right flex justify-center items-start pt-4"
                                    style={{ transform: `rotate(${index * 45 + 22.5}deg)` }}
                                >
                                    {segment.icon}
                                </div>
                            ))}
                        </div>

                        {/* Spin Button in the center */}
                        <button
                            onClick={handleSpinClick}
                            disabled={!canSpin}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-white border-4 border-yellow-300 shadow-lg flex flex-col items-center justify-center text-red-500 font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:scale-110 active:scale-100 disabled:scale-100 z-10"
                        >
                            {isAdLoading ? (
                                <i className="fa-solid fa-spinner fa-spin text-xl"></i>
                            ) : (
                                <>
                                    <i className="fa-solid fa-play text-xl mb-1"></i>
                                    <span className="text-sm">SPIN</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Status Bar & Messages */}
                    <div>
                        <div className="flex justify-around items-center bg-gray-100 p-3 rounded-xl">
                            <button onClick={handleOpenInfo} className="w-8 h-8 flex items-center justify-center text-[var(--gray)] hover:text-[var(--dark)] bg-white rounded-full shadow"><i className="fa-solid fa-info"></i></button>
                            <div className="text-center">
                                <p className="text-xs text-[var(--gray)]">Spins Left</p>
                                <p className="font-bold text-[var(--dark)]">{spinsLeft}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-[var(--gray)]">Wins</p>
                                <p className="font-bold text-green-500">{spinWheelState.winsToday}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-[var(--gray)]">Losses</p>
                                <p className="font-bold text-red-500">{spinWheelState.lossesToday}</p>
                            </div>
                        </div>
                        
                        <div className="mt-2 space-y-2">
                             {spinsLeft <= 0 && !isSpinning && (
                                <p className="text-center text-sm text-blue-600 bg-blue-100 p-2 rounded-lg">
                                    <i className="fa-solid fa-clock mr-2"></i>You have used all your spins. Come back tomorrow!
                                </p>
                            )}
                            {!isOnline && (
                                <p className="text-center text-sm text-red-600 bg-red-100 p-2 rounded-lg">
                                    <i className="fa-solid fa-wifi-slash mr-2"></i>You are offline. Please check your connection.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </Modal>
            
            <CongratsModal
                isOpen={result !== null && typeof result === 'number'}
                prize={typeof result === 'number' ? result : 0}
                onClaim={handleCloseResultModal}
            />

            <LossModal
                isOpen={result === 'no_prize'}
                onClose={handleCloseResultModal}
            />

            <SpinWheelInfoModal isOpen={isInfoModalOpen} onClose={() => setInfoModalOpen(false)} segments={segments} />
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .animate-fadeIn { animation: fadeIn 0.3s ease forwards; }
                @keyframes slideInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .animate-slideInUp { animation: slideInUp 0.3s ease-out forwards; }
            `}</style>
        </>
    );
};

export default LuckyWheelModal;
