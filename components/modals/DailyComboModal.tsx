import React, { useState, useRef, useEffect } from 'react';
import Modal from '../Modal';

interface DailyComboModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEarnPoints: (points: number, title: string, icon: string, iconColor: string) => void;
}

const STORAGE_KEY = 'dailyComboLastCompletion';

const DailyComboModal: React.FC<DailyComboModalProps> = ({ isOpen, onClose, onEarnPoints }) => {
  const [code, setCode] = useState(['', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [claimedReward, setClaimedReward] = useState(0);
  const [comboCompletedToday, setComboCompletedToday] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // Reset state after a delay to allow for outro animations
      const timer = setTimeout(() => {
        setCode(['', '', '', '']);
        setShowSuccess(false);
        setClaimedReward(0);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      // Check if combo was completed today when modal opens
      const isSameDay = (d1: Date, d2: Date) => {
          return d1.getFullYear() === d2.getFullYear() &&
              d1.getMonth() === d2.getMonth() &&
              d1.getDate() === d2.getDate();
      };

      const lastCompletionTimestamp = localStorage.getItem(STORAGE_KEY);
      if (lastCompletionTimestamp) {
        const lastCompletionDate = new Date(parseInt(lastCompletionTimestamp, 10));
        if (isSameDay(lastCompletionDate, new Date())) {
          setComboCompletedToday(true);
        } else {
          setComboCompletedToday(false);
        }
      } else {
        setComboCompletedToday(false);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGoToTelegram = () => {
    window.open('https://t.me/telegram', '_blank', 'noopener,noreferrer');
  };

  const completeCombo = (points: number, title: string, icon: string, iconColor: string) => {
    onEarnPoints(points, title, icon, iconColor);
    setClaimedReward(points);
    setShowSuccess(true);
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    setComboCompletedToday(true); // Mark as completed for this session
    setTimeout(onClose, 1500);
  };

  const handleSkip = () => {
    completeCombo(100, 'Daily Combo Skip', 'fa-solid fa-forward', 'text-sky-400');
  };

  const handleClaim = () => {
    const comboReward = 5000; // Mock reward for a correct combo
    completeCombo(comboReward, 'Daily Combo Claim', 'fa-solid fa-puzzle-piece', 'text-green-400');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const { value } = e.target;
    // Allow only single alphanumeric characters
    if (/^[a-zA-Z0-9]?$/.test(value)) {
        const newCode = [...code];
        newCode[index] = value.toUpperCase();
        setCode(newCode);
    
        // Move to next input if a character is entered
        if (value && index < 3) {
            inputRefs.current[index + 1]?.focus();
        }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    // Move to previous input on backspace if current input is empty
    if (e.key === 'Backspace' && !code[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
    }
  };

  const isCodeComplete = code.every(digit => digit !== '');

  if (showSuccess) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="">
            <div className="text-center p-6 bg-white rounded-2xl">
                <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4 border-4 border-green-200">
                    <i className="fa-solid fa-gift text-green-500 text-4xl"></i>
                </div>
                <h3 className="text-2xl font-bold text-[var(--dark)] mb-2">Reward Claimed!</h3>
                <p className="text-[var(--gray)]">
                    You have received <span className="font-bold text-[var(--success)]">{claimedReward.toLocaleString()} bonus points</span>!
                </p>
            </div>
        </Modal>
    )
  }

  if (comboCompletedToday) {
     return (
        <Modal isOpen={isOpen} onClose={onClose} title="" maxWidth="max-w-sm">
            <div className="relative bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white rounded-2xl p-6 text-center">
                 <div className="w-20 h-20 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-4 border-4 border-white/30">
                    <i className="fa-solid fa-check-double text-white text-4xl"></i>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Combo Completed!</h3>
                <p className="text-white/80">
                    You have already claimed the daily combo reward. Come back tomorrow for a new one!
                </p>
            </div>
        </Modal>
     )
  }


  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" maxWidth="max-w-sm">
      <div className="relative bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white rounded-2xl p-6 overflow-hidden">
        
        {/* Confetti Animation */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute bg-green-400 rounded-full animate-fall"
              style={{
                width: `${Math.random() * 5 + 3}px`,
                height: `${Math.random() * 5 + 3}px`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${Math.random() * 3 + 2}s`,
                opacity: Math.random(),
              }}
            ></div>
          ))}
           {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={i}
              className="absolute bg-pink-400 rounded-sm animate-fall"
              style={{
                width: `${Math.random() * 6 + 4}px`,
                height: `${Math.random() * 6 + 4}px`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 6}s`,
                animationDuration: `${Math.random() * 4 + 3}s`,
                opacity: Math.random(),
              }}
            ></div>
          ))}
        </div>
        <style>{`
          @keyframes fall {
            0% { transform: translateY(-100px) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
          }
          .animate-fall {
            animation-name: fall;
            animation-timing-function: linear;
            animation-iteration-count: infinite;
          }
        `}</style>
        
        {/* Close Button is now handled by the parent Modal component */}
        
        {/* Header */}
        <div className="flex items-center justify-center mb-6 relative">
           <h2 className="text-2xl font-bold z-10">Daily Combo</h2>
        </div>

        {/* Code Input Area */}
        <div className="flex justify-center space-x-3 mb-4">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="w-14 h-16 bg-white/10 border border-white/20 rounded-lg text-3xl text-center text-white font-bold backdrop-blur-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              placeholder="?"
            />
          ))}
        </div>

        {/* Instructions */}
        <p className="text-center text-gray-300 mb-6 px-4">
          The official <span className="font-bold text-[#00d2d3]">Telegram</span> daily latest post will contain the CODE
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col items-center">
            {isCodeComplete ? (
                 <button
                    onClick={handleClaim}
                    className="w-full bg-gradient-to-r from-green-400 to-teal-500 text-white font-bold py-3 rounded-xl shadow-lg transition-transform hover:scale-105"
                >
                    Claim Reward
                </button>
            ) : (
                <button
                    onClick={handleGoToTelegram}
                    className="w-full bg-gradient-to-r from-yellow-400 to-amber-600 text-gray-800 font-bold py-3 rounded-xl shadow-lg transition-transform hover:scale-105"
                >
                    Go to Telegram
                </button>
            )}
          <button
            onClick={handleSkip}
            className="mt-4 text-sm text-sky-400 hover:text-sky-300 transition-colors"
          >
            Skip combo, get 100 points
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DailyComboModal;