import React, { useState, useEffect, useMemo } from 'react';
import { SpinWheelState } from '../../types';

interface SpinWheelModalProps {
    isOpen: boolean;
    onClose: () => void;
    spinWheelState: SpinWheelState;
    onSpinComplete: (prize: number | string) => void;
    isOnline: boolean; // NOVA PROP
}

interface Segment {
    value: number | string;
    colorClass: string;
    icon: React.ReactNode;
    name: string; // Add name for info modal
}

const CongratsModal: React.FC<{ prize: number; onClaim: () => void; }> = ({ prize, onClaim }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClaim();
        }, 1000);
        return () => clearTimeout(timer);
    }, [onClaim]);

    return (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex justify-center items-center z-50 animate-fadeIn">
            <div className="bg-white p-6 rounded-2xl shadow-lg w-11/12 text-center border-2 border-primary animate-slideInUp">
                <i className="fa-solid fa-wand-magic-sparkles text-6xl mx-auto text-success mb-4"></i>
                <h2 className="text-2xl font-bold text-dark mb-2">You Won!</h2>
                <p className="text-gray mb-6">
                    Congratulations! You've won <span className="font-bold text-dark">{prize}</span> points!
                </p>
            </div>
        </div>
    );
};

const LossModal: React.FC<{ onClose: () => void; }> = ({ onClose }) => (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex justify-center items-center z-50 animate-fadeIn">
        <div className="bg-white p-6 rounded-2xl shadow-lg w-11/12 text-center border-2 border-error animate-slideInUp">
            <i className="fa-solid fa-face-frown-open text-6xl mx-auto text-error mb-4"></i>
            <h2 className="text-2xl font-bold text-dark mb-2">Oops! Try Again!</h2>
            <p className="text-gray mb-6">
                Unfortunately, you didn't win this time. Better luck on your next spin!
            </p>
            <button
                onClick={onClose}
                className="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/30 transition-transform hover:scale-105"
            >
                OK
            </button>
        </div>
    </div>
);

const SpinWheelInfoModal: React.FC<{ isOpen: boolean; onClose: () => void; segments: Segment[]; }> = ({ isOpen, onClose, segments }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[110] animate-fadeIn" onClick={onClose}>
            <div className="bg-white p-6 rounded-2xl shadow-lg max-w-sm w-11/12 relative animate-slideInUp" onClick={e => e.stopPropagation()}>
                <button className="absolute top-4 right-4 text-gray hover:text-dark" onClick={onClose} aria-label="Close">
                    <i className="fa-solid fa-xmark text-2xl"></i>
                </button>
                <h2 className="text-2xl font-bold text-center text-dark mb-6">Spin Wheel Info</h2>
                
                <p className="text-center text-gray text-sm mb-4">Learn what each color on the wheel means.</p>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                    {segments.map((segment, index) => (
                        <div key={index} className="flex items-center gap-4 bg-gray-light p-3 rounded-xl">
                            <div className={`w-8 h-8 rounded-full ${segment.colorClass.split(' ').filter(cls => cls.startsWith('bg-gradient-to') || cls.startsWith('from-') || cls.startsWith('to-')).join(' ')} flex-shrink-0 flex items-center justify-center`}>
                                {/* Using a simple colored circle, as gradients are hard to represent in a small swatch */}
                                <div className={`w-6 h-6 rounded-full ${segment.colorClass.includes('sky') ? 'bg-sky-500' : segment.colorClass.includes('slate') ? 'bg-slate-500' : segment.colorClass.includes('violet') ? 'bg-violet-500' : segment.colorClass.includes('rose') ? 'bg-rose-500' : segment.colorClass.includes('amber') ? 'bg-amber-500' : segment.colorClass.includes('lime') ? 'bg-lime-500' : segment.colorClass.includes('fuchsia') ? 'bg-fuchsia-500' : 'bg-gray-500'}`}></div>
                            </div>
                            <div className="flex-grow">
                                <p className="font-bold text-dark">{segment.name}</p>
                                <p className="text-sm text-gray">{typeof segment.value === 'number' ? `Win ${segment.value} points` : 'No prize'}</p>
                            </div>
                            <div className="text-xl">{segment.icon}</div>
                        </div>
                    ))}
                </div>
                <button
                    onClick={onClose}
                    className="mt-6 w-full bg-primary text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/30 transition-transform hover:scale-105"
                >
                    Got It!
                </button>
            </div>
        </div>
    );
};


const SpinWheelModal: React.FC<SpinWheelModalProps> = ({ isOpen, onClose, spinWheelState, onSpinComplete, isOnline }) => { // Adiciona isOnline aqui
    const segments: Segment[] = useMemo(() => [
        { value: 100, colorClass: 'bg-gradient-to-br from-sky-400 to-sky-600', icon: <i className="fa-solid fa-coins text-2xl text-yellow-300 drop-shadow-lg"></i>, name: '100 Points' },
        { value: 'Try Again', colorClass: 'bg-gradient-to-br from-slate-400 to-slate-600', icon: <i className="fa-solid fa-face-frown text-2xl text-slate-200 drop-shadow-lg"></i>, name: 'No Prize' },
        { value: 250, colorClass: 'bg-gradient-to-br from-violet-400 to-violet-600', icon: <i className="fa-solid fa-coins text-2xl text-yellow-300 drop-shadow-lg"></i>, name: '250 Points' },
        { value: 800, colorClass: 'bg-gradient-to-br from-rose-400 to-rose-600', icon: <i className="fa-solid fa-gem text-2xl text-white/80 drop-shadow-lg"></i>, name: '800 Points' },
        { value: 'Try Again', colorClass: 'bg-gradient-to-br from-slate-400 to-slate-600', icon: <i className="fa-solid fa-face-frown text-2xl text-slate-200 drop-shadow-lg"></i>, name: 'No Prize' },
        { value: 300, colorClass: 'bg-gradient-to-br from-amber-400 to-amber-600', icon: <i className="fa-solid fa-coins text-2xl text-yellow-300 drop-shadow-lg"></i>, name: '300 Points' },
        { value: 150, colorClass: 'bg-gradient-to-br from-lime-400 to-lime-600', icon: <i className="fa-solid fa-coins text-2xl text-yellow-300 drop-shadow-lg"></i>, name: '150 Points' },
        { value: 600, colorClass: 'bg-gradient-to-br from-fuchsia-400 to-fuchsia-600', icon: <i className="fa-solid fa-sack-dollar text-2xl text-yellow-200 drop-shadow-lg"></i>, name: '600 Points' }
    ], []);

    const [isSpinning, setIsSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [showCongrats, setShowCongrats] = useState(false);
    const [showLossModal, setShowLossModal] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [wonPrize, setWonPrize] = useState<number | string | null>(null);

    const MAX_SPINS_PER_DAY = 10;
    const SPIN_DURATION_MS = 6000;
    const COOLDOWN_DURATION_MS = 15000; // Original duration from previous logic was 6000 + a bit. Let's make it 6 seconds for spin + 1.5 seconds for prize reveal.
    const spinsLeft = MAX_SPINS_PER_DAY - spinWheelState.spinsToday;

    useEffect(() => {
        if (!isOpen) {
            setIsSpinning(false);
            setShowCongrats(false);
            setShowLossModal(false);
            setWonPrize(null);
            setShowInfoModal(false); // Close info modal if main modal closes
        }
    }, [isOpen]);

    const handleSpin = () => {
        if (!isOnline) { // IMPEDE AÇÕES SE ESTIVER OFFLINE
            alert('Você está offline. Conecte-se à internet para girar a roleta.');
            return;
        }
        if (isSpinning || spinsLeft <= 0) return;

        setIsSpinning(true);
        // Display ad before spinning to ensure user interaction
        const spinAdUrl = 'https://viikqoye.com/dc/?blockID=398500';
        // Fix: Access WebApp properties directly on window.Telegram.WebApp
        if (window.Telegram?.WebApp) {
            window.Telegram.WebApp.openLink(spinAdUrl);
        } else {
            window.open(spinAdUrl, '_blank', 'noopener,noreferrer');
        }

        const { spinsToday, winsToday, lossesToday } = spinWheelState;
        const WIN_QUOTA = 6;
        const LOSS_QUOTA = 4;
        let isWin: boolean;

        // Determine outcome based on quotas
        if (winsToday >= WIN_QUOTA && lossesToday < LOSS_QUOTA) {
            isWin = false; // Must lose to meet quota
        } else if (lossesToday >= LOSS_QUOTA && winsToday < WIN_QUOTA) {
            isWin = true; // Must win to meet quota
        } else if (winsToday >= WIN_QUOTA && lossesToday >= LOSS_QUOTA) {
            // This case should not happen if MAX_SPINS_PER_DAY is 10, but as a fallback, let's keep it random.
            isWin = Math.random() < (6 / 8); 
        } else {
            const spinsRemaining = MAX_SPINS_PER_DAY - spinsToday;
            const winsNeeded = WIN_QUOTA - winsToday;
            const lossesNeeded = LOSS_QUOTA - lossesToday;

            if (winsNeeded > 0 && winsNeeded >= spinsRemaining) {
                isWin = true; // Not enough spins left, must be a win
            } else if (lossesNeeded > 0 && lossesNeeded >= spinsRemaining) {
                isWin = false; // Not enough spins left, must be a loss
            } else {
                // Probabilistic choice to meet quotas over time
                const winProbability = winsNeeded / (winsNeeded + lossesNeeded);
                isWin = Math.random() < winProbability;
            }
        }
        
        const winningSegmentIndices = segments.map((s, i) => typeof s.value === 'number' ? i : -1).filter(i => i !== -1);
        const losingSegmentIndices = segments.map((s, i) => typeof s.value !== 'number' ? i : -1).filter(i => i !== -1);
        
        const winningSegmentIndex = isWin
            ? winningSegmentIndices[Math.floor(Math.random() * winningSegmentIndices.length)]
            : losingSegmentIndices[Math.floor(Math.random() * losingSegmentIndices.length)];

        const prize = segments[winningSegmentIndex].value;
        setWonPrize(prize);

        // Adjust rotation to land on the chosen segment
        const randomExtraTurns = Math.floor(Math.random() * 3) + 8; // Ensures multiple full rotations
        const segmentAngle = 360 / segments.length;
        const targetAngleOffset = (segmentAngle / 2); // Center of the segment
        const finalAngle = (360 - (winningSegmentIndex * segmentAngle)) - targetAngleOffset + (Math.random() * segmentAngle * 0.4 - segmentAngle * 0.2); // Randomize within the segment
        
        const newRotation = rotation + (randomExtraTurns * 360) + finalAngle;
        
        setRotation(newRotation);

        setTimeout(() => {
            onSpinComplete(prize);
            if (typeof prize === 'number') {
                setShowCongrats(true);
            } else {
                setShowLossModal(true);
            }
            setIsSpinning(false); // Ensure spinning state is reset after outcome
        }, SPIN_DURATION_MS); // Use SPIN_DURATION_MS for the UI transition
    };

    const handleClaim = () => {
        setShowCongrats(false);
        setWonPrize(null);
        // setIsSpinning is already set to false in the setTimeout
    };
    
    const handleLossModalClose = () => {
        setShowLossModal(false);
        setWonPrize(null);
        // setIsSpinning is already set to false in the setTimeout
    };

    if (!isOpen) return null;

    const segmentAngle = 360 / segments.length;

    const renderButtonContent = () => {
        if (isSpinning) {
            return 'Spinning...';
        }
        if (spinsLeft <= 0) {
            return 'No spins left today';
        }
        return 'Spin to Win!';
    };

    const isSpinButtonDisabled = isSpinning || spinsLeft <= 0 || !isOnline; // DESABILITA SE ESTIVER OFFLINE

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[100] animate-fadeIn" onClick={onClose}>
            <div className="bg-white p-6 rounded-2xl shadow-lg max-w-sm w-11/12 relative animate-slideInUp overflow-hidden" onClick={e => e.stopPropagation()}>
                {showCongrats && typeof wonPrize === 'number' && <CongratsModal prize={wonPrize} onClaim={handleClaim} />}
                {showLossModal && <LossModal onClose={handleLossModalClose} />}
                {showInfoModal && <SpinWheelInfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} segments={segments} />}
                
                <button className="absolute top-4 right-4 text-gray hover:text-dark z-20" onClick={onClose} aria-label="Close">
                    <i className="fa-solid fa-xmark text-2xl"></i>
                </button>
                <button className="absolute top-4 left-4 text-gray hover:text-dark z-20 p-2" onClick={() => setShowInfoModal(true)} aria-label="Wheel Information">
                    <i className="fa-solid fa-circle-info text-2xl"></i>
                </button>

                <div className="text-center">
                    <h2 className="text-2xl font-bold text-dark mb-1">Lucky Wheel</h2>
                    <p className="font-bold text-lg text-primary mb-4">
                        Spins left: <span className="text-accent">{spinsLeft}</span>
                    </p>
                </div>

                <div className="relative w-72 h-72 mx-auto mb-6 p-2 bg-gradient-to-tr from-primary to-accent-secondary rounded-full shadow-inner">
                    <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 z-10 drop-shadow-lg" style={{
                        width: 0, height: 0,
                        borderLeft: '16px solid transparent',
                        borderRight: '16px solid transparent',
                        borderTop: '28px solid #ef4444' // red-500
                    }}></div>
                    <div
                        className="w-full h-full rounded-full border-4 border-amber-300 shadow-xl relative overflow-hidden transition-transform ease-[cubic-bezier(0.25,0.1,0.25,1)]"
                        style={{ transform: `rotate(${rotation}deg)`, transitionDuration: `${isSpinning ? SPIN_DURATION_MS : 0}ms` }}
                    >
                        {segments.map((segment, index) => (
                            <div
                                key={index}
                                className={`absolute w-1/2 h-1/2 top-0 left-1/2 origin-[0%_100%] flex justify-center items-start pt-4 font-bold text-white ${segment.colorClass}`}
                                style={{ transform: `rotate(${index * segmentAngle}deg) skewY(-${90 - segmentAngle}deg)` }}
                            >
                                <div 
                                    style={{ transform: `skewY(${90 - segmentAngle}deg) rotate(${segmentAngle / 2}deg) translateY(-10px)` }} 
                                    className="flex flex-col items-center justify-center text-center"
                                >
                                     {segment.icon}
                                     <span className="text-base font-extrabold text-white/90 drop-shadow-md mt-1">
                                        {typeof segment.value === 'number' ? segment.value : 'Oops!'}
                                     </span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <button
                            className="w-20 h-20 bg-white rounded-full shadow-inner flex items-center justify-center pointer-events-auto"
                            onClick={handleSpin}
                            disabled={isSpinButtonDisabled}
                            aria-label="Spin the wheel"
                        >
                            <div className="w-16 h-16 bg-gradient-to-br from-primary-light to-primary-dark rounded-full shadow-md flex items-center justify-center text-white font-bold text-sm">
                                SPIN
                            </div>
                        </button>
                    </div>
                </div>

                <button 
                    className="w-full bg-gradient-to-r from-secondary to-accent-secondary text-white font-bold py-3 rounded-xl shadow-lg shadow-secondary/30 transition-all hover:scale-105 hover:brightness-110 active:scale-100 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none" 
                    onClick={handleSpin} 
                    disabled={isSpinButtonDisabled}>
                    {renderButtonContent()}
                </button>
            </div>
        </div>
    );
};

export default SpinWheelModal;