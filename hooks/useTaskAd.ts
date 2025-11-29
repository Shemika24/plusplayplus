
import { useState, useCallback, useRef, useEffect } from 'react';

declare global {
    interface Window {
        show_10206331: (tag?: string) => Promise<void>;
    }
}

interface UseTaskAdOptions {
    onReward: (data: { taskId: number; points: number }) => void;
    onError: (error: any) => void;
}

export const useTaskAd = ({ onReward, onError }: UseTaskAdOptions) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isAdActive, setIsAdActive] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isAdActiveRef = useRef(false);
    const currentTaskIdRef = useRef<number | null>(null);

    // Cleanup
    useEffect(() => {
        return () => clearAllTimers();
    }, []);

    const clearAllTimers = useCallback(() => {
        if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
        }
    }, []);

    const showTaskAd = useCallback(async (taskId: number, points: number, duration: number, type: 'Interstitial' | 'Pop') => {
        if (isLoading) return;
        
        setIsLoading(true);
        currentTaskIdRef.current = taskId;
        
        // 1. Attempt to show real Ad via SDK
        if (typeof window.show_10206331 === 'function') {
            try {
                if (type === 'Pop') {
                    // Use 'pop' argument as requested
                    await window.show_10206331('pop');
                } else {
                    // Standard call for others (Interstitial)
                    await window.show_10206331();
                }
                
                onReward({ taskId, points });
                setIsLoading(false);
                return;
            } catch (e) {
                console.warn("Ad SDK failed/closed, falling back to timer logic.", e);
                // Fallback to timer logic below
            }
        }

        // 2. Fallback: Simulating timer based task
        setTimeout(() => {
            // Start Unified Timer Logic
            setIsAdActive(true);
            isAdActiveRef.current = true;
            setTimeLeft(duration);
            setIsLoading(false);

            const startTime = Date.now();
            const endTime = startTime + (duration * 1000);

            if (countdownRef.current) clearInterval(countdownRef.current);

            countdownRef.current = setInterval(() => {
                const now = Date.now();
                const remainingMs = endTime - now;
                const remainingSeconds = Math.ceil(remainingMs / 1000);
                
                if (remainingSeconds <= 0) {
                    // Timer finished logic
                    if (countdownRef.current) clearInterval(countdownRef.current);
                    countdownRef.current = null;
                    setTimeLeft(0);
                    
                    // UX Improvement: Wait 1 second showing "0" before completing
                    setTimeout(() => {
                        // Check if still active (user didn't cancel during the delay)
                        if (isAdActiveRef.current) {
                            setIsAdActive(false);
                            isAdActiveRef.current = false;
                            currentTaskIdRef.current = null;
                            
                            onReward({ taskId, points });
                        }
                    }, 1000);

                } else {
                    setTimeLeft(remainingSeconds);
                }
            }, 200);
            
            console.log(`Task ${taskId} started. Duration: ${duration}s. Type: ${type} (Fallback Mode)`);
            
        }, 300);

    }, [isLoading, onReward, clearAllTimers]);

    const cancelAd = useCallback((isSystemCancellation = false) => {
        if (isAdActiveRef.current) {
            clearAllTimers();
            setIsAdActive(false);
            isAdActiveRef.current = false;
            currentTaskIdRef.current = null;
            setIsLoading(false);
            
            const msg = "Task cancelled.";
            onError(new Error(msg));
        }
    }, [clearAllTimers, onError]);

    return {
        showTaskAd,
        cancelAd,
        isLoading,
        isAdActive,
        timeLeft
    };
};
