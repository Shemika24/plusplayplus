
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Screen, Task, UserProfile, TaskHistory } from '../types';
import { getDailyTaskState, completeTask as completeTaskInService } from '../services/firestoreService';
import { useTaskAd } from '../hooks/useTaskAd';
import { playSound, vibrate, SOUNDS } from '../utils/sound';

interface TasksScreenProps {
  onNavigate: (screen: Screen) => void;
  onEarnPoints: (points: number, title: string, icon: string, iconColor: string, skipDbSave?: boolean) => void;
  userProfile: UserProfile;
}

interface ShuffledTask extends Task {
    categoryIcon: string;
    categoryIconBgColor: string;
    categoryIconColor: string;
}

interface DailyTaskState {
    tasks: ShuffledTask[];
    isOnBreak: boolean;
    breakEndTime: Date | null;
    completedToday: number;
    totalForDay: number;
    availableInBatch: number;
}

// --- Sub-Components ---
const SkeletonTaskItemCard: React.FC = () => (
    <div className="bg-[var(--bg-card)] rounded-xl shadow-md flex items-center p-2.5 border border-[var(--border-color)] animate-pulse">
        <div className="w-10 h-10 rounded-lg bg-[var(--bg-input)] mr-3 flex-shrink-0"></div>
        <div className="flex-grow space-y-2">
            <div className="h-4 bg-[var(--bg-input)] rounded w-3/4"></div>
            <div className="h-3 bg-[var(--bg-input)] rounded w-1/2"></div>
        </div>
        <div className="h-8 w-24 rounded-full bg-[var(--bg-input)] ml-2 flex-shrink-0"></div>
    </div>
);

const TaskItemCard: React.FC<{ task: ShuffledTask; onStart: (task: ShuffledTask) => void; isActive: boolean; disabled: boolean; }> = ({ task, onStart, isActive, disabled }) => (
    <div className="bg-[var(--bg-card)] rounded-xl shadow-md flex items-center p-3 border border-[var(--border-color)] hover:border-[var(--primary)] transition-colors">
        <div className={`w-11 h-11 rounded-lg ${task.categoryIconBgColor} flex items-center justify-center mr-3 flex-shrink-0`}>
            <i className={`${task.categoryIcon} ${task.categoryIconColor} text-xl`}></i>
        </div>
        <div className="flex-grow">
            <h4 className="font-semibold text-sm text-[var(--dark)]">{task.title}</h4>
            <div className="flex items-center text-xs text-[var(--primary)] font-semibold mt-1">
                <i className="fa-regular fa-clock mr-1"></i>
                <span>{task.duration}s</span>
                <span className="mx-1.5 text-[var(--gray)]">|</span>
                <span className="text-green-500 font-bold">+{task.points} pts</span>
            </div>
        </div>
        <button
            onClick={() => onStart(task)}
            disabled={disabled}
            className={`font-bold h-9 w-24 rounded-full shadow-md text-sm ml-2 flex-shrink-0 transition-all duration-300 flex items-center justify-center
                ${disabled
                    ? 'bg-[var(--bg-input)] text-[var(--gray)] cursor-wait'
                    : 'bg-gradient-to-r from-amber-600 to-yellow-400 text-white transform hover:scale-105'
                }`}
        >
            {isActive ? (
                <>
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                    <span>Wait</span>
                </>
            ) : (
                'Start'
            )}
        </button>
    </div>
);

const SuccessModal: React.FC<{ points: number }> = ({ points }) => (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[110]">
        <div className="bg-[var(--bg-card)] p-6 rounded-2xl shadow-lg max-w-xs w-11/12 relative text-center animate-fadeIn border border-[var(--border-color)]">
            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4 border-4 border-green-200">
                <i className="fa-solid fa-check-circle text-green-500 text-4xl"></i>
            </div>
            <h3 className="text-xl font-bold text-[var(--dark)] mb-2">Task Complete!</h3>
            <p className="text-[var(--gray)]">
                You earned <span className="font-bold text-[var(--success)]">{points}</span> points!
            </p>
        </div>
        <style>{`
            @keyframes fadeIn { from { opacity: 0; scale: 0.95; } to { opacity: 1; scale: 1; } }
            .animate-fadeIn { animation: fadeIn 0.15s ease-out forwards; }
        `}</style>
    </div>
);

const BreakTimer: React.FC<{ endTime: Date; onBreakEnd: () => void }> = ({ endTime, onBreakEnd }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            const difference = endTime.getTime() - now.getTime();

            if (difference <= 0) {
                setTimeLeft('00:00:00');
                onBreakEnd();
                return;
            }

            const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((difference / 1000 / 60) % 60);
            const seconds = Math.floor((difference / 1000) % 60);
            const pad = (num: number) => num.toString().padStart(2, '0');
            setTimeLeft(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);
        return () => clearInterval(timer);
    }, [endTime, onBreakEnd]);

    return (
        <div className="text-center p-6 bg-[var(--bg-card)] rounded-xl shadow-lg border border-[var(--border-color)]">
            <i className="fa-solid fa-mug-hot text-5xl text-sky-500 mb-4"></i>
            <h3 className="text-2xl font-bold text-[var(--dark)]">Time for a break!</h3>
            <p className="text-[var(--gray)] mt-2">
                Great job! Your next set of tasks will be available in:
            </p>
            <p className="font-mono text-4xl font-bold text-[var(--dark)] my-4 bg-[var(--bg-input)] p-3 rounded-lg tracking-wider inline-block">
                {timeLeft}
            </p>
        </div>
    );
};

const TasksScreen: React.FC<TasksScreenProps> = ({ onNavigate, onEarnPoints, userProfile }) => {
    const [dailyState, setDailyState] = useState<DailyTaskState | null>(null);
    const [isLoadingState, setIsLoadingState] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
    const [successInfo, setSuccessInfo] = useState<{ points: number } | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    
    // Auto Mode: OFF | INTERS | POP | MIXED
    const [autoMode, setAutoMode] = useState<'OFF' | 'INTERS' | 'POP' | 'MIXED'>('OFF');
    
    const fetchAndProcessTasks = useCallback(async () => {
        setIsLoadingState(true);
        setFetchError(false);
        try {
            const state = await getDailyTaskState(userProfile.uid);
            setDailyState(state);
            if (state.isOnBreak || state.tasks.length === 0) {
                setAutoMode('OFF');
            }
        } catch (error) {
            console.error("Failed to fetch task state:", error);
            setFetchError(true);
        } finally {
            setIsLoadingState(false);
        }
    }, [userProfile.uid]);

    useEffect(() => {
        fetchAndProcessTasks();
    }, [fetchAndProcessTasks]);

    // Calculate total remaining time based on tasks in the queue
    const totalRemainingTimeStr = useMemo(() => {
        if (!dailyState?.tasks) return "00:00:00";
        const totalSeconds = dailyState.tasks.reduce((acc, task) => acc + task.duration, 0);
        
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        const pad = (num: number) => num.toString().padStart(2, '0');
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }, [dailyState?.tasks]);

    const handleTaskSuccess = useCallback(async ({ taskId, points }: { taskId: number; points: number }) => {
        if (!dailyState) return;
        
        playSound(SOUNDS.SUCCESS, 1.0);
        vibrate(500);

        const completedTask = dailyState.tasks.find(t => t.id === taskId);
        
        setDailyState(prev => {
             if (!prev) return null;
             const updatedTasks = prev.tasks.filter(t => t.id !== taskId);
             return {
                 ...prev,
                 tasks: updatedTasks,
                 completedToday: prev.completedToday + 1,
             };
        });

        setActiveTaskId(null);

        if (!completedTask) return;

        try {
            const historyItem: Omit<TaskHistory, 'id' | 'timestamp'> = {
                reward: points,
                title: completedTask.title,
                icon: completedTask.categoryIcon,
                iconColor: completedTask.categoryIconColor,
                date: new Date().toLocaleDateString("en-US", { timeZone: "America/New_York" }),
            };

            await completeTaskInService(userProfile.uid, taskId, points, historyItem);
            onEarnPoints(points, completedTask.title, completedTask.categoryIcon, completedTask.categoryIconColor, true);
            
            setSuccessInfo({ points });
            setTimeout(() => setSuccessInfo(null), 1500); 
            
            const latestState = await getDailyTaskState(userProfile.uid);
            setDailyState(latestState);
            
            if (latestState.isOnBreak || latestState.tasks.length === 0) {
                setAutoMode('OFF');
            }

        } catch (error: any) {
            console.error("Sync error:", error);
            setErrorMessage("Network error. Points were not saved. Please try again.");
            setAutoMode('OFF');
            setTimeout(() => setErrorMessage(null), 4000);
        }
    }, [dailyState, userProfile.uid, onEarnPoints]);

    const { showTaskAd, cancelAd, isAdActive, timeLeft, isLoading: isAdLoading } = useTaskAd({
        onReward: handleTaskSuccess,
        onError: (err) => {
            const safeMsg = err instanceof Error ? err.message : String(err);
            console.error("Ad failed:", safeMsg);
            setErrorMessage(safeMsg || "Task failed. Please try again.");
            setTimeout(() => setErrorMessage(null), 3000);
            setActiveTaskId(null);
            setAutoMode('OFF');
        }
    });

    const handleStartTask = useCallback(async (task: ShuffledTask) => {
        if (activeTaskId !== null || isAdActive || isAdLoading) return;
        
        setActiveTaskId(task.id);
        setErrorMessage(null);

        const isInterstitial = task.categoryIcon.includes('fa-rectangle-ad') || task.title.includes('Inters');
        const type = isInterstitial ? 'Interstitial' : 'Pop';
        const duration = isInterstitial ? 15 : 20;
        
        showTaskAd(task.id, task.points, duration, type);
    }, [activeTaskId, isAdActive, isAdLoading, showTaskAd]);


    // --- AUTO MODE LOGIC ---
    useEffect(() => {
        if (autoMode !== 'OFF' && activeTaskId === null && !isAdActive && !isAdLoading && !errorMessage && dailyState && dailyState.tasks.length > 0) {
            
            const autoTimer = setTimeout(() => {
                if (dailyState.tasks.length > 0) {
                    const nextTask = dailyState.tasks.find(t => {
                        const isInters = t.categoryIcon.includes('fa-rectangle-ad');
                        const isPop = t.categoryIcon.includes('fa-clone');
                        
                        if (autoMode === 'INTERS') return isInters;
                        if (autoMode === 'POP') return isPop;
                        if (autoMode === 'MIXED') return true;
                        return false;
                    });

                    if (nextTask) {
                        handleStartTask(nextTask);
                    } else {
                        // If no more tasks of this type, turn off auto
                        setAutoMode('OFF');
                    }
                } else {
                    setAutoMode('OFF');
                }
            }, 1000); // 1 second delay between tasks for smooth transition

            return () => clearTimeout(autoTimer);
        }
        
        if (dailyState?.isOnBreak) {
            setAutoMode('OFF');
        }

    }, [autoMode, activeTaskId, isAdActive, isAdLoading, errorMessage, dailyState, handleStartTask]);

    const isTaskRunning = activeTaskId !== null || isAdActive || isAdLoading;

    // Helper to format countdown time like 00:00:15
    const formatCountdown = (seconds: number) => {
        const pad = (num: number) => num.toString().padStart(2, '0');
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${pad(h)}:${pad(m)}:${pad(s)}`;
    };

    const renderContent = () => {
        if (isLoadingState) {
            return (
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => <SkeletonTaskItemCard key={i} />)}
                </div>
            );
        }

        if (fetchError) {
             return (
                <div className="text-center p-8 bg-[var(--bg-card)] rounded-xl shadow-lg border border-red-200">
                    <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <i className="fa-solid fa-wifi text-red-500 text-2xl"></i>
                    </div>
                    <h3 className="text-xl font-bold text-[var(--dark)]">Connection Issue</h3>
                    <p className="text-[var(--gray)] mt-2">Could not load tasks. Please check your internet.</p>
                    <button onClick={fetchAndProcessTasks} className="mt-4 px-6 py-2 bg-[var(--primary)] text-white rounded-lg">Retry</button>
                </div>
             );
        }

        if (!dailyState) return null;

        if (dailyState.isOnBreak && dailyState.breakEndTime) {
            return (
                <BreakTimer 
                    endTime={dailyState.breakEndTime} 
                    onBreakEnd={fetchAndProcessTasks} 
                />
            );
        }

        if (dailyState.tasks.length === 0) {
            return (
                <div className="text-center p-8 bg-[var(--bg-card)] rounded-xl shadow-lg border border-[var(--border-color)]">
                     <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <i className="fa-solid fa-check-double text-green-500 text-2xl"></i>
                    </div>
                    <h3 className="text-xl font-bold text-[var(--dark)]">All Caught Up!</h3>
                    <p className="text-[var(--gray)] mt-2">You've completed all tasks for this batch.</p>
                </div>
            );
        }

        return (
            <div className="space-y-3 pb-24">
                {dailyState.tasks.map(task => (
                    <TaskItemCard 
                        key={task.id} 
                        task={task} 
                        onStart={handleStartTask}
                        isActive={activeTaskId === task.id}
                        disabled={activeTaskId !== null && activeTaskId !== task.id}
                    />
                ))}
            </div>
        );
    };

    // Overlay for Task Execution (Countdown/Cancel)
    const renderAdOverlay = () => {
        if (!isAdActive && !isAdLoading) return null;

        return (
            <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-fadeIn select-none">
                <div className="w-24 h-24 mb-6 relative flex items-center justify-center">
                    <svg className="animate-spin h-full w-full text-[var(--primary)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isAdActive && <span className="absolute font-bold text-3xl text-white">{timeLeft}</span>}
                </div>
                
                <p className="text-white font-bold text-xl animate-pulse mb-2">
                    {isAdLoading ? "Loading Task..." : "Completing Task..."}
                </p>
                <p className="text-white/60 text-sm text-center max-w-xs">
                    Please wait while we verify your action. Do not close this window.
                </p>
                
                <button 
                    onClick={() => cancelAd(false)}
                    className="mt-12 px-8 py-3 rounded-full bg-white/10 text-white font-semibold hover:bg-white/20 transition-all border border-white/20"
                >
                    Cancel
                </button>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-[var(--gray-light)] relative">
            {renderAdOverlay()}
            
            {/* Top Card: Redesigned Minimalist Layout */}
             <div className="p-4 bg-[var(--bg-card)] border-b border-[var(--border-color)] shadow-sm sticky top-0 z-20">
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    
                    {/* Row 1: Title & History (Icon Only) */}
                    <div className="flex items-center text-[var(--dark)] font-bold text-lg">
                        <i className="fa-solid fa-list-check text-[var(--primary)] mr-2.5 text-xl"></i>
                        <span>Tasks</span>
                    </div>
                    <div className="flex justify-end items-center">
                        <button 
                            onClick={() => onNavigate('TaskHistory')}
                            className="text-[var(--gray)] hover:text-[var(--primary)] transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-input)]"
                        >
                            <i className="fa-solid fa-clock-rotate-left text-lg"></i>
                        </button>
                    </div>

                    {/* Row 2: Available & Tiny Auto Btns */}
                    <div className="flex items-center text-sm text-[var(--gray)] font-medium">
                        <i className="fa-solid fa-layer-group text-[var(--primary)] mr-2"></i>
                        Available: <span className="ml-2 text-[var(--dark)] font-bold text-base">{dailyState?.tasks.length || 0}</span>
                    </div>
                    <div className="flex justify-end items-center gap-3">
                         {/* Tiny Auto Buttons - Low Opacity by default */}
                         
                         {/* Button 1: Inters Only (Auto) */}
                         <button 
                            onClick={() => setAutoMode(autoMode === 'INTERS' ? 'OFF' : 'INTERS')}
                            className={`transition-all transform active:scale-95
                                ${autoMode === 'INTERS' 
                                    ? 'text-red-500 opacity-100 scale-125' 
                                    : 'text-[var(--gray)] opacity-30 hover:opacity-100 hover:scale-110'}`}
                         >
                            <i className="fa-solid fa-rectangle-ad text-xs"></i>
                         </button>
                         
                         {/* Button 2: Pop Only (Auto) */}
                         <button 
                            onClick={() => setAutoMode(autoMode === 'POP' ? 'OFF' : 'POP')}
                            className={`transition-all transform active:scale-95
                                ${autoMode === 'POP' 
                                    ? 'text-blue-500 opacity-100 scale-125' 
                                    : 'text-[var(--gray)] opacity-30 hover:opacity-100 hover:scale-110'}`}
                         >
                            <i className="fa-solid fa-clone text-xs"></i>
                         </button>

                         {/* Button 3: Mixed (Auto) */}
                         <button 
                            onClick={() => setAutoMode(autoMode === 'MIXED' ? 'OFF' : 'MIXED')}
                            className={`transition-all transform active:scale-95
                                ${autoMode === 'MIXED' 
                                    ? 'text-purple-500 opacity-100 scale-125' 
                                    : 'text-[var(--gray)] opacity-30 hover:opacity-100 hover:scale-110'}`}
                         >
                            <i className="fa-solid fa-layer-group text-xs"></i>
                         </button>
                    </div>

                    {/* Row 3: Timer & Done */}
                    <div className="flex items-center h-8 text-[var(--gray)]">
                        {isTaskRunning ? (
                             <div className="flex items-center animate-pulse">
                                <i className="fa-solid fa-hourglass-half mr-2 text-[var(--primary)]"></i>
                                <span className="font-mono text-[var(--primary)] font-bold text-base">
                                    {timeLeft > 0 ? formatCountdown(timeLeft) : "00:00:00"}
                                </span>
                             </div>
                        ) : (
                             <div className="flex items-center">
                                <i className="fa-solid fa-hourglass-half mr-2 text-[var(--gray)]"></i>
                                <span className="font-mono font-semibold text-base">
                                    {totalRemainingTimeStr}
                                </span>
                             </div>
                        )}
                    </div>
                    <div className="flex justify-end items-center text-sm text-[var(--gray)] font-medium">
                        Done: <span className="ml-2 text-[var(--success)] font-bold text-base">{dailyState?.completedToday || 0}</span>
                    </div>
                </div>
             </div>

             <div className="flex-1 overflow-y-auto p-4">
                 {errorMessage && (
                    <div className="mb-4 bg-red-100 border border-red-200 text-red-700 text-sm font-semibold rounded-xl p-3 text-center animate-bounce shadow-sm">
                        <i className="fa-solid fa-circle-exclamation mr-2"></i>
                        {errorMessage}
                    </div>
                 )}
                 {renderContent()}
             </div>

             {successInfo && <SuccessModal points={successInfo.points} />}
        </div>
    );
};

export default TasksScreen;
