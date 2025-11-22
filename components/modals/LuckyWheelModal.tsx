
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { SpinWheelState } from '../../types';
import Modal from '../Modal';
import { useRewardedAd } from '../../hooks/useRewardedAd';

// --- Sound Effects ---
const playSound = (src: string, volume: number = 1.0) => {
    try {
        const audio = new Audio(src);
        audio.volume = volume;
        audio.play().catch(() => {
            // Silently ignore playback errors
        });
    } catch (e) {
        // Silently ignore audio initialization errors
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
    hexColor: string;
    icon: React.ReactNode;
    name: string;
}

// --- Sub-Modals ---
const CongratsModal: React.FC<{ isOpen: boolean; prize: number; onClaim: () => void; }> = ({ isOpen, prize, onClaim }) => {
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(onClaim, 3000); // Auto-close after 3s
            return () => clearTimeout(timer);
        }
    }, [isOpen, onClaim]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[110] animate-fadeIn">
            <div className="bg-[var(--bg-card)] p-6 rounded-2xl shadow-lg max-w-xs w-11/12 relative animate-slideInUp text-center border border-[var(--border-color)]">
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
            const timer = setTimeout(onClose, 3000); // Auto-close after 3s
            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose]);
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[110] animate-fadeIn">
            <div className="bg-[var(--bg-card)] p-6 rounded-2xl shadow-lg max-w-xs w-11/12 relative animate-slideInUp text-center border border-[var(--border-color)]">
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

    // Filter unique segments for the legend
    const uniqueSegments = useMemo(() => {
        const seen = new Set<string>();
        return segments.filter(segment => {
            if (seen.has(segment.name)) return false;
            seen.add(segment.name);
            return true;
        });
    }, [segments]);

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[110] animate-fadeIn" onClick={onClose}>
            <div className="bg-[var(--bg-card)] p-6 rounded-2xl shadow-lg max-w-sm w-11/12 relative animate-slideInUp border border-[var(--border-color)]" onClick={e => e.stopPropagation()}>
                <button className="absolute top-4 right-4 text-[var(--gray)] hover:text-[var(--dark)]" onClick={onClose}><i className="fa-solid fa-xmark text-2xl"></i></button>
                <h2 className="text-2xl font-bold text-center text-[var(--dark)] mb-2">Wheel Prizes</h2>
                <div className="grid grid-cols-4 gap-3 mt-4">
                     {uniqueSegments.map((segment, index) => (
                        <div key={index} className="flex flex-col items-center justify-center text-center gap-1 bg-[var(--bg-input)] p-2 rounded-xl border border-[var(--border-color)]">
                            <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: segment.hexColor }}>
                                {segment.icon}
                            </div>
                            <p className="font-semibold text-xs text-center text-[var(--dark)] mt-1 leading-tight">{segment.name}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const LuckyWheelModal: React.FC<LuckyWheelModalProps> = ({ isOpen, onClose, spinWheelState, onSpinComplete, isOnline }) => {
    // 8 Segments configuration matching the "Wheel Prizes" concept
    const segments: Segment[] = useMemo(() => [
        { value: 400, hexColor: '#0284c7', icon: <i className="fa-solid fa-coins text-white text-xl"></i>, name: '400 Pts' }, // Blue
        { value: 5000, hexColor: '#059669', icon: <i className="fa-solid fa-gem text-white text-xl"></i>, name: '5000 Pts' },   // Teal
        { value: 700, hexColor: '#7c3aed', icon: <i className="fa-solid fa-coins text-white text-xl"></i>, name: '700 Pts' }, // Violet
        { value: 1000, hexColor: '#e11d48', icon: <i className="fa-solid fa-coins text-white text-xl"></i>, name: '1000 Pts' }, // Rose
        { value: 2500, hexColor: '#d97706', icon: <i className="fa-solid fa-star text-white text-xl"></i>, name: '2500 Pts' }, // Amber
        { value: 'no_prize', hexColor: '#475569', icon: <i className="fa-solid fa-face-meh text-white text-xl"></i>, name: 'No Prize' }, // Slate
        { value: 100, hexColor: '#65a30d', icon: <i className="fa-solid fa-coins text-white text-xl"></i>, name: '100 Pts' },  // Lime
        { value: 250, hexColor: '#c026d3', icon: <i className="fa-solid fa-coins text-white text-xl"></i>, name: '250 Pts' },  // Fuchsia
    ], []);

    const MAX_SPINS_PER_DAY = 10;
    const [targetWins] = useState(() => Math.floor(Math.random() * 3) + 5);

    const [isSpinning, setIsSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [result, setResult] = useState<number | string | null>(null);
    const [isInfoModalOpen, setInfoModalOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    
    // State for immediate freeze logic on error
    const [transitionDuration, setTransitionDuration] = useState('20000ms');
    const wheelRef = useRef<HTMLDivElement>(null);
    
    // Store the pending prize to be revealed after the 20s wait
    const pendingResultRef = useRef<number | string | null>(null);

    const handleSpinError = useCallback(() => {
        if (wheelRef.current) {
            // 1. Compute current visual rotation
            const computedStyle = window.getComputedStyle(wheelRef.current);
            const matrix = new WebKitCSSMatrix(computedStyle.transform);
            
            // Extract angle from matrix
            const angle = Math.round(Math.atan2(matrix.m12, matrix.m11) * (180 / Math.PI));
            const currentRotation = angle < 0 ? angle + 360 : angle;
            
            // 2. Kill transition immediately
            setTransitionDuration('0ms');
            
            // 3. Force React state to current visual angle to "freeze" it
            // We add the full rotations we've already done to keep it consistent
            const totalRotations = Math.floor(rotation / 360);
            const newFrozenRotation = (totalRotations * 360) + currentRotation;
            
            setRotation(newFrozenRotation);
        }
        
        setIsSpinning(false);
    }, [rotation]);

    // Ad Hook
    const { 
        showRewardedAd, 
        cancelAd, 
        preloadAd, 
        isLoading: isAdLoading, 
        isAdActive 
    } = useRewardedAd({
        minViewTimeSeconds: 20, // EXACTLY 20 SECONDS
        maxViewTimeSeconds: 20, // EXACTLY 20 SECONDS
        onReward: (data) => {
            // This callback fires when the 20s timer finishes
            console.log(`Ad/Timer completed. Granting result.`);
            finalizeSpin();
        },
        onError: (err: any) => {
            const msg = err?.message || "Could not load ad. Please try again.";
            setErrorMessage(msg);
            setTimeout(() => setErrorMessage(null), 3000);
            handleSpinError();
        }
    });

    useEffect(() => {
        if (isOpen) {
            preloadAd();
        }
    }, [isOpen, preloadAd]);

    // Triggered when the 20s timer (ad) finishes
    const finalizeSpin = () => {
        const prize = pendingResultRef.current;
        if (prize === null) return;

        setResult(prize);
        onSpinComplete(prize);
        
        if (typeof prize === 'number') {
            playSound(SOUNDS.WIN, 0.8);
            vibrate([100, 50, 100, 50, 100]);
        } else {
            playSound(SOUNDS.LOSE, 0.6);
            vibrate(300);
        }
    };

    const handleSpinClick = () => {
        if (isSpinning || !isOnline || spinWheelState.spinsToday >= MAX_SPINS_PER_DAY) return;
        setErrorMessage(null);

        // 1. Calculate Result Immediately
        const { winsToday, lossesToday } = spinWheelState;
        const targetLosses = MAX_SPINS_PER_DAY - targetWins;
        const winsRemaining = targetWins - winsToday;
        const lossesRemaining = targetLosses - lossesToday;
        
        let isWinResult: boolean;
        if (winsRemaining <= 0) {
            isWinResult = false;
        } else if (lossesRemaining <= 0) {
            isWinResult = true;
        } else {
            isWinResult = Math.random() < winsRemaining / (winsRemaining + lossesRemaining);
        }

        const prizeSegments = segments.filter(s => typeof s.value === 'number');
        const lossSegments = segments.filter(s => s.value === 'no_prize');

        const winningSegment = isWinResult
            ? prizeSegments[Math.floor(Math.random() * prizeSegments.length)]
            : lossSegments[Math.floor(Math.random() * lossSegments.length)];
        
        const winningIndex = segments.indexOf(winningSegment);
        
        // Store logic result
        pendingResultRef.current = winningSegment.value;

        // 2. Calculate Rotation
        // Segment angle math
        const segmentAngle = 45;
        const segmentCenter = (winningIndex * segmentAngle) + (segmentAngle / 2);
        
        // Add A LOT of rotations to cover the 20 seconds duration
        // 20 seconds duration. Let's do roughly 80 full spins.
        const baseRotation = 360 * 80; 
        const adjustment = (360 - segmentCenter); 
        
        // Next rotation accumulation
        const nextRotation = rotation + baseRotation + adjustment - (rotation % 360);
        
        // 3. Start Visuals IMMEDIATELY
        playSound(SOUNDS.SPIN_START, 0.5);
        setTransitionDuration('20000ms'); // Ensure duration is set correctly
        setIsSpinning(true);
        setResult(null);
        setRotation(nextRotation);

        // 4. Start Timer (via Ad Hook) - DELAYED BY 3 SECONDS
        setTimeout(() => {
            showRewardedAd();
        }, 3000);
    };

    const handleCloseResultModal = useCallback(() => {
        setResult(null);
        setIsSpinning(false);
    }, []);

    if (!isOpen) return null;

    const spinsLeft = MAX_SPINS_PER_DAY - spinWheelState.spinsToday;
    const canSpin = !isSpinning && isOnline && spinsLeft > 0 && !isAdLoading && !isAdActive;

    // Build gradient string dynamically
    const gradientString = `conic-gradient(
        ${segments.map((s, i) => `${s.hexColor} ${i * 45}deg ${(i + 1) * 45}deg`).join(', ')}
    )`;

    return (
        <>
            <Modal isOpen={isOpen} onClose={isSpinning || isAdActive ? () => {} : onClose} title="Lucky Wheel">
                <div className="p-4 md:p-6 relative overflow-hidden flex flex-col items-center">
                    
                    {/* Error Overlay */}
                    {errorMessage && (
                        <div className="absolute top-4 w-11/12 bg-red-500 text-white text-sm py-2 px-4 rounded-lg shadow-lg z-40 animate-fadeIn text-center">
                            {errorMessage}
                        </div>
                    )}

                    {/* WHEEL CONTAINER */}
                    <div className="relative w-72 h-72 mb-6">
                        
                        {/* POINTER (Fixed at Top Center) */}
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none drop-shadow-md">
                             <i className="fa-solid fa-location-dot text-red-600 text-5xl fa-rotate-180"></i>
                        </div>

                        {/* THE ROTATING WHEEL */}
                        <div 
                            ref={wheelRef}
                            className="w-full h-full rounded-full border-[8px] border-white shadow-2xl relative transition-transform cubic-bezier(0.25, 0.1, 0.25, 1)"
                            style={{
                                transform: `rotate(${rotation}deg)`,
                                background: gradientString,
                                transitionDuration: transitionDuration
                            }}
                        >
                            {/* Render Segments Icons (No Numbers) */}
                            {segments.map((segment, i) => (
                                <div 
                                    key={i}
                                    className="absolute w-full h-full top-0 left-0"
                                    style={{
                                        // Rotate container to point to the slice center
                                        transform: `rotate(${i * 45 + 22.5}deg)`
                                    }}
                                >
                                    {/* Position content towards the edge */}
                                    <div className="absolute top-4 left-1/2 -translate-x-1/2 transform">
                                        {/* Rotate icon back if needed, or keep it radial. Let's keep radial for wheel look */}
                                        <div className="drop-shadow-sm text-2xl">
                                            {segment.icon}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            {/* Inner White Center to verify separation */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 rounded-full"></div>
                        </div>

                        {/* CENTER SPIN BUTTON */}
                        <button
                            onClick={handleSpinClick}
                            disabled={!canSpin}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-white border-4 border-yellow-400 shadow-xl flex flex-col items-center justify-center text-[var(--dark)] font-bold z-20 hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isAdLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : 'SPIN'}
                        </button>
                    </div>

                    {/* STATS */}
                    <div className="w-full max-w-xs">
                        <div className="flex justify-around items-center bg-[var(--bg-input)] border border-[var(--border-color)] p-3 rounded-xl">
                            <button onClick={() => setInfoModalOpen(true)} className="w-8 h-8 bg-[var(--bg-card)] rounded-full shadow text-[var(--gray)]"><i className="fa-solid fa-info"></i></button>
                            <div className="text-center">
                                <p className="text-xs text-[var(--gray)]">Left</p>
                                <p className="font-bold text-[var(--dark)]">{spinsLeft}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-[var(--gray)]">Wins</p>
                                <p className="font-bold text-green-600">{spinWheelState.winsToday}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-[var(--gray)]">Losses</p>
                                <p className="font-bold text-red-600">{spinWheelState.lossesToday}</p>
                            </div>
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
