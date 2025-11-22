
import React, { useState, useRef, useEffect } from 'react';
import Modal from '../Modal';
import { storageService } from '../../utils/storage';

interface DailyComboModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEarnPoints: (points: number, title: string, icon: string, iconColor: string) => void;
}

const STORAGE_KEY = 'bonusCodeLastCompletion';
const COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000; // 3 Days in milliseconds

const DailyComboModal: React.FC<DailyComboModalProps> = ({ isOpen, onClose, onEarnPoints }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [claimedReward, setClaimedReward] = useState(0);
  const [isCooldown, setIsCooldown] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [isLoadingState, setIsLoadingState] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // Reset state after a delay to allow for outro animations
      const timer = setTimeout(() => {
        setCode(['', '', '', '', '', '']);
        setShowSuccess(false);
        setClaimedReward(0);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      // Check cooldown asynchronously
      const checkCooldown = async () => {
        setIsLoadingState(true);
        try {
            const lastCompletionTimestamp = await storageService.getItem(STORAGE_KEY);
            if (lastCompletionTimestamp) {
                const lastTime = parseInt(lastCompletionTimestamp, 10);
                const now = Date.now();
                const diff = now - lastTime;

                if (diff < COOLDOWN_MS) {
                setIsCooldown(true);
                } else {
                setIsCooldown(false);
                }
            } else {
                setIsCooldown(false);
            }
        } catch (e) {
            console.error("Error checking cooldown", e);
        } finally {
            setIsLoadingState(false);
        }
      };
      checkCooldown();
    }
  }, [isOpen]);

  // Timer for cooldown
  useEffect(() => {
      if (!isCooldown || !isOpen) return;

      const updateTimer = async () => {
          const lastCompletionTimestamp = await storageService.getItem(STORAGE_KEY);
          if (!lastCompletionTimestamp) return;
          
          const targetTime = parseInt(lastCompletionTimestamp, 10) + COOLDOWN_MS;
          const now = Date.now();
          const diff = targetTime - now;

          if (diff <= 0) {
              setIsCooldown(false);
              setTimeLeft('');
          } else {
              const days = Math.floor(diff / (1000 * 60 * 60 * 24));
              const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
              const minutes = Math.floor((diff / 1000 / 60) % 60);
              const seconds = Math.floor((diff / 1000) % 60);
              
              const dStr = days > 0 ? `${days}d ` : '';
              const hStr = hours.toString().padStart(2, '0');
              const mStr = minutes.toString().padStart(2, '0');
              const sStr = seconds.toString().padStart(2, '0');

              setTimeLeft(`${dStr}${hStr}h ${mStr}m ${sStr}s`);
          }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000); // Update every second
      return () => clearInterval(interval);
  }, [isCooldown, isOpen]);


  if (!isOpen) return null;

  const handleGoToTelegram = () => {
    window.open('https://t.me/dyverze_ads_announcement', '_blank', 'noopener,noreferrer');
  };

  const completeCombo = async (points: number, title: string, icon: string, iconColor: string) => {
    onEarnPoints(points, title, icon, iconColor);
    setClaimedReward(points);
    setShowSuccess(true);
    await storageService.setItem(STORAGE_KEY, Date.now().toString());
    setIsCooldown(true);
    setTimeout(onClose, 3000);
  };

  const handleClaim = () => {
    const comboReward = 5000; // Mock reward
    completeCombo(comboReward, 'Bonus Code Claim', 'fa-solid fa-ticket', 'text-pink-400');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const { value } = e.target;
    // Allow only single alphanumeric characters
    if (/^[a-zA-Z0-9]?$/.test(value)) {
        const newCode = [...code];
        newCode[index] = value.toUpperCase();
        setCode(newCode);
    
        // Move to next input if a character is entered
        if (value && index < 5) {
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

  if (isLoadingState) {
      return (
        <Modal isOpen={isOpen} onClose={onClose} title="Loading...">
            <div className="p-6 flex justify-center">
                <i className="fa-solid fa-spinner fa-spin text-3xl text-[var(--primary)]"></i>
            </div>
        </Modal>
      );
  }

  if (showSuccess) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="">
            <div className="text-center p-6 bg-white rounded-2xl">
                <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4 border-4 border-green-200">
                    <i className="fa-solid fa-gift text-green-500 text-4xl"></i>
                </div>
                <h3 className="text-2xl font-bold text-[var(--dark)] mb-2">Code Redeemed!</h3>
                <p className="text-[var(--gray)]">
                    You have received <span className="font-bold text-[var(--success)]">{claimedReward.toLocaleString()} bonus points</span>!
                </p>
            </div>
        </Modal>
    )
  }

  if (isCooldown) {
     return (
        <Modal isOpen={isOpen} onClose={onClose} title="Redeem Bonus Code" maxWidth="max-w-sm">
            <div className="relative bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-2xl p-6 text-center">
                 <div className="w-20 h-20 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-4 border-4 border-white/30">
                    <i className="fa-solid fa-hourglass-half text-white text-4xl"></i>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Cooldown Active</h3>
                <p className="text-white/90 mb-4">
                    You can redeem another bonus code in:
                </p>
                <div className="bg-white/20 rounded-lg p-3 inline-block">
                    <p className="font-mono text-xl font-bold">{timeLeft}</p>
                </div>
                <button 
                    onClick={onClose}
                    className="mt-6 w-full bg-white text-purple-600 font-bold py-3 rounded-xl shadow-lg hover:bg-gray-100 transition-all"
                >
                    Close
                </button>
            </div>
        </Modal>
     )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Redeem Bonus Code">
      <div className="p-4">
        <div className="bg-blue-50 rounded-xl p-4 mb-6 flex items-start">
            <i className="fa-brands fa-telegram text-blue-500 text-3xl mr-4 mt-1"></i>
            <div>
                <h4 className="font-bold text-[var(--dark)]">Join our Telegram Channel</h4>
                <p className="text-sm text-[var(--gray)] mt-1">
                    We post new bonus codes every 3 days. Join now to get the latest codes!
                </p>
                <button 
                    onClick={handleGoToTelegram}
                    className="mt-2 text-sm font-bold text-blue-600 hover:underline flex items-center"
                >
                    Open Channel <i className="fa-solid fa-arrow-up-right-from-square ml-1 text-xs"></i>
                </button>
            </div>
        </div>

        <div className="text-center mb-6">
            <p className="text-[var(--gray)] mb-4 text-sm font-medium uppercase tracking-wide">Enter 6-Digit Code</p>
            <div className="flex justify-center gap-2">
                {code.map((digit, index) => (
                    <input
                        key={index}
                        ref={el => { inputRefs.current[index] = el; }}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleChange(e, index)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        className="w-10 h-14 sm:w-12 sm:h-16 text-center text-xl font-bold border-2 border-gray-200 rounded-lg focus:border-[var(--primary)] focus:ring-2 focus:ring-blue-100 outline-none transition-all uppercase"
                    />
                ))}
            </div>
        </div>

        <button
          onClick={handleClaim}
          disabled={!isCodeComplete}
          className="w-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white font-bold py-3.5 rounded-xl shadow-lg hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
        >
           Redeem Code
        </button>
      </div>
    </Modal>
  );
};

export default DailyComboModal;
