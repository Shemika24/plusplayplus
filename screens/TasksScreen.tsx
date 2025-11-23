

import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { Task, TaskCategory, TasksScreenProps } from '../types';
import DailyProgress from '../components/DailyProgress';

interface MiniTaskCardProps {
    task: Task;
    onStartAd: (task: Task) => void;
    taskType: 'pop' | 'inter' | 'visit' | 'website' | 'extra' | 'other';
    disabled?: boolean;
}

const MiniTaskCard: React.FC<MiniTaskCardProps> = React.memo(({ task, onStartAd, taskType, disabled = false }) => {
    const isDisabled = disabled || task.status === 'completed';

    const handleClick = () => {
        if (['pop', 'inter', 'visit', 'website', 'extra'].includes(taskType)) {
            onStartAd(task);
        }
    };

    return (
        <div className={`flex items-center gap-2 bg-white rounded-xl p-2 shadow-sm transition-all duration-200 ${isDisabled ? 'opacity-60 bg-gray-light' : 'hover:shadow-md hover:-translate-y-0.5'}`}>
            <div className="w-12 h-12 flex items-center justify-center bg-secondary/10 rounded-lg flex-shrink-0">
                <i className="fa-solid fa-coins text-3xl text-secondary"></i>
            </div>
            <div className="flex-grow min-w-0">
                <h4 className="font-bold text-sm text-dark truncate">{task.name}</h4>
                <p className="text-xs text-gray truncate">{task.description}</p>
                <div className="flex items-center gap-2 text-xs font-medium mt-1">
                    <span className="text-secondary">{task.time}s</span>
                    <span className="text-success">+{task.reward} points</span>
                </div>
            </div>
            <button
                className={`flex items-center justify-center flex-shrink-0 w-16 h-8 rounded-lg font-bold text-sm transition-colors ${task.status === 'completed' ? 'bg-success text-white' : 'bg-primary text-white hover:bg-primary-dark'} disabled:bg-gray disabled:cursor-not-allowed`}
                disabled={isDisabled}
                onClick={handleClick}
                aria-label={`Start ${task.name}`}
            >
                {task.status === 'completed' ? <i className="fa-solid fa-circle-check mx-auto text-xl"/> : 'Start'}
            </button>
        </div>
    );
});

interface StatCardProps {
    icon: React.ReactNode;
    title: string;
    stats: { label: string; value: string | number }[];
    color: string;
    actionButton?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = React.memo(({ icon, title, stats, color, actionButton }) => (
    <div className={`bg-white p-4 rounded-2xl shadow-md flex items-start gap-4 border-l-4 ${color} relative`}>
        <div className="flex-shrink-0 pt-1">{icon}</div>
        <div className="flex-grow">
            <h3 className="font-bold text-dark">{title}</h3>
            <div className="flex gap-4 text-sm mt-1">
                {stats.map(stat => (
                    <div key={stat.label}>
                        <span className="text-gray">{stat.label}: </span>
                        <span className="font-bold text-dark">{stat.value}</span>
                    </div>
                ))}
            </div>
        </div>
        {actionButton && (
            <div className="absolute top-2 right-2">
                {actionButton}
            </div>
        )}
    </div>
));

const CountdownTimer: React.FC<{ endTime: number; prefix: string }> = React.memo(({ endTime, prefix }) => {
    const calculateTimeLeft = useCallback(() => {
        const timeLeft = endTime - Date.now();
        return Math.max(0, timeLeft);
    }, [endTime]);

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearInterval(timer);
    }, [calculateTimeLeft]);
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60)).toString().padStart(2, '0');
    const minutes = Math.floor((timeLeft / 1000 / 60) % 60).toString().padStart(2, '0');
    const seconds = Math.floor((timeLeft / 1000) % 60).toString().padStart(2, '0');

    if (hours !== '00') {
      return <span className="text-sm font-medium text-primary">{prefix} {hours}:{minutes}:{seconds}</span>;
    }
    return <span className="text-sm font-medium text-primary">{prefix} {minutes}:{seconds}</span>;
});

const TasksScreen: React.FC<TasksScreenProps> = ({ addTransaction, categories, setCategories, interstitialState, popAdState, visitAdState, websiteAdState, extraAdState, onStartAd, onOpenHistory, referralCount }) => {
    const TOTAL_INTERSTITIAL_ADS = 1080;
    const INTERSTITIAL_BATCH_SIZE = 180;
    const POP_ADS_BATCH_SIZE = 150;
    const TOTAL_POP_ADS_DAILY = 1200;
    const VISIT_ADS_BATCH_SIZE = 360;
    const TOTAL_VISIT_ADS_DAILY = 720;
    const WEBSITE_ADS_BATCH_SIZE = 180;
    const TOTAL_WEBSITE_ADS_DAILY = 620;
    const EXTRA_ADS_BATCH_SIZE = 60;
    const TOTAL_EXTRA_ADS_DAILY = 180;

    const [isAutoPopAdsRunning, setIsAutoPopAdsRunning] = useState(false);
    const autoPopAdIntervalRef = useRef<number | null>(null);

    const now = Date.now();
    const isInterCooldown = now < interstitialState.nextBatchAvailableAt;
    const areInterstitialAdsExhausted = interstitialState.completedTodayCount >= TOTAL_INTERSTITIAL_ADS;
    
    const arePopAdsExhausted = popAdState.completedTodayCount >= TOTAL_POP_ADS_DAILY;
    const isPopAdCooldown = popAdState.cooldownUntil > now;
    
    const areVisitAdsExhausted = visitAdState.completedTodayCount >= TOTAL_VISIT_ADS_DAILY;
    const isVisitAdCooldown = visitAdState.cooldownUntil > now;
    
    const areWebsiteAdsExhausted = websiteAdState.completedTodayCount >= TOTAL_WEBSITE_ADS_DAILY;
    const isWebsiteAdCooldown = websiteAdState.cooldownUntil > now;

    const areExtraAdsExhausted = extraAdState.completedTodayCount >= TOTAL_EXTRA_ADS_DAILY;
    const isExtraAdCooldown = extraAdState.cooldownUntil > now;

    useEffect(() => {
        if (isAutoPopAdsRunning) {
            const runNextAd = () => {
                const popCategory = categories.find(c => c.id === 'pop');
                const currentPopAdState = popAdState; // Use the state from the render it was created in.
                const now = Date.now();
                const isCooldown = currentPopAdState.cooldownUntil > now;
                const areExhausted = currentPopAdState.completedTodayCount >= TOTAL_POP_ADS_DAILY;

                if (!popCategory || areExhausted || isCooldown) {
                    setIsAutoPopAdsRunning(false);
                    return;
                }

                const nextTask = popCategory.tasks.find(t => t.status === 'pending');
                if (nextTask) {
                    onStartAd(nextTask);
                } else {
                    setIsAutoPopAdsRunning(false);
                }
            };

            autoPopAdIntervalRef.current = window.setInterval(runNextAd, 16000);
        }

        // Cleanup function for when isAutoPopAdsRunning becomes false OR dependencies change
        return () => {
            if (autoPopAdIntervalRef.current) {
                clearInterval(autoPopAdIntervalRef.current);
                autoPopAdIntervalRef.current = null;
            }
        };
    }, [isAutoPopAdsRunning, categories, onStartAd, popAdState]);

    const taskScreenCategories = useMemo(() => categories.filter(c => c.id !== 'auto' && c.id !== 'ai-generated'), [categories]);

    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<string[]>(() => taskScreenCategories.map(c => c.id));
    
    const handleFilterChange = (categoryId: string) => {
        setSelectedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };
    
    const areAllSelected = useMemo(() => selectedCategories.length === taskScreenCategories.length, [selectedCategories, taskScreenCategories]);

    const toggleSelectAll = () => {
        if (areAllSelected) {
            setSelectedCategories([]);
        } else {
            setSelectedCategories(taskScreenCategories.map(c => c.id));
        }
    };

    const filteredCategories = useMemo(() =>
        taskScreenCategories.filter(c => selectedCategories.includes(c.id)),
        [taskScreenCategories, selectedCategories]
    );

    const { completed, remaining } = useMemo(() => {
        const TOTAL_ADS_PER_DAY = 1080 + 1200 + 720 + 620 + 180;
        const totalCompleted = interstitialState.completedTodayCount + popAdState.completedTodayCount + visitAdState.completedTodayCount + websiteAdState.completedTodayCount + extraAdState.completedTodayCount;
        const remainingCount = Math.max(0, TOTAL_ADS_PER_DAY - totalCompleted);
        return { completed: totalCompleted, remaining: remainingCount };
    }, [interstitialState, popAdState, visitAdState, websiteAdState, extraAdState]);

    const progressData = useMemo(() => {
        const data = [
            { id: 'inter', title: 'Interstitial', completed: interstitialState.completedTodayCount, total: TOTAL_INTERSTITIAL_ADS, color: 'bg-primary' },
            { id: 'pop', title: 'Pop', completed: popAdState.completedTodayCount, total: TOTAL_POP_ADS_DAILY, color: 'bg-accent' },
            { id: 'visit', title: 'Visit', completed: visitAdState.completedTodayCount, total: TOTAL_VISIT_ADS_DAILY, color: 'bg-secondary' },
            { id: 'website', title: 'Website', completed: websiteAdState.completedTodayCount, total: TOTAL_WEBSITE_ADS_DAILY, color: 'bg-success' },
            { id: 'extra', title: 'Extra', completed: extraAdState.completedTodayCount, total: TOTAL_EXTRA_ADS_DAILY, color: 'bg-purple-500' }
        ];
    
        return data.map(d => {
            const category = categories.find(c => c.id === d.id);
            return category ? { ...d, title: category.title.replace(' Ads', ''), color: category.color } : d;
        });
    }, [categories, interstitialState, popAdState, visitAdState, websiteAdState, extraAdState]);

    const renderCategoryStatus = (category: TaskCategory) => {
        if (category.id === 'inter') {
            if (areInterstitialAdsExhausted) return <span className="text-sm font-medium text-success">Daily limit reached!</span>;
            if (isInterCooldown) return <CountdownTimer endTime={interstitialState.nextBatchAvailableAt} prefix="Next batch in:" />;
            return <span className="text-sm font-medium text-gray">Batch: {interstitialState.currentBatchCompletedCount}/{INTERSTITIAL_BATCH_SIZE}</span>;
        }
        if (category.id === 'pop') {
            if (arePopAdsExhausted) return <span className="text-sm font-medium text-success">Daily limit reached!</span>;
            if (isPopAdCooldown) return <CountdownTimer endTime={popAdState.cooldownUntil} prefix="Next batch in:" />;
            return (
                <span className="text-sm font-medium text-gray">
                    Batch: {popAdState.currentBatchCompletedCount}/{POP_ADS_BATCH_SIZE}
                </span>
            );
        }
        if (category.id === 'visit') {
            if (areVisitAdsExhausted) return <span className="text-sm font-medium text-success">Daily limit reached!</span>;
            if (isVisitAdCooldown) return <CountdownTimer endTime={visitAdState.cooldownUntil} prefix="Next batch in:" />;
            return (
                 <span className="text-sm font-medium text-gray">
                    Batch: {visitAdState.completedTodayCount % VISIT_ADS_BATCH_SIZE}/{VISIT_ADS_BATCH_SIZE}
                </span>
            )
        }
        if (category.id === 'website') {
            if (areWebsiteAdsExhausted) return <span className="text-sm font-medium text-success">Daily limit reached!</span>;
            if (isWebsiteAdCooldown) return <CountdownTimer endTime={websiteAdState.cooldownUntil} prefix="Next batch in:" />;
            return (
                 <span className="text-sm font-medium text-gray">
                    Batch: {websiteAdState.currentBatchCompletedCount}/{WEBSITE_ADS_BATCH_SIZE}
                </span>
            )
        }
        if (category.id === 'extra') {
            if (areExtraAdsExhausted) return <span className="text-sm font-medium text-success">Daily limit reached!</span>;
            if (isExtraAdCooldown) return <CountdownTimer endTime={extraAdState.cooldownUntil} prefix="Next batch in:" />;
            return (
                 <span className="text-sm font-medium text-gray">
                    Batch: {extraAdState.currentBatchCompletedCount}/{EXTRA_ADS_BATCH_SIZE}
                </span>
            )
        }
        return null;
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
                <StatCard 
                    icon={<i className="fa-solid fa-list-check text-4xl text-primary"></i>}
                    title="Ads & Tasks"
                    stats={[
                        { label: 'Completed', value: completed },
                        { label: 'Remaining', value: remaining }
                    ]}
                    color="border-primary"
                    actionButton={
                        <button onClick={onOpenHistory} className="p-2 rounded-full text-gray hover:bg-gray-light transition-colors" aria-label="View history">
                            <i className="fa-solid fa-clock-rotate-left text-xl"></i>
                        </button>
                    }
                />
            </div>
            
            <DailyProgress progressData={progressData} />

            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-dark">Task Categories</h2>
                <button onClick={() => setIsFilterOpen(prev => !prev)} className="flex items-center gap-2 text-primary font-semibold p-2 rounded-lg hover:bg-primary/10 transition-colors">
                    <i className="fa-solid fa-filter text-xl"></i>
                    <span>Filter</span>
                </button>
            </div>

            {isFilterOpen && (
                <div className="bg-white p-4 rounded-xl shadow-md animate-fadeIn space-y-3 border border-gray-medium">
                    <h3 className="font-bold text-dark">Filter by Ad Type</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {taskScreenCategories.map(category => (
                            <label key={category.id} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-light transition-colors">
                                <input
                                    type="checkbox"
                                    checked={selectedCategories.includes(category.id)}
                                    onChange={() => handleFilterChange(category.id)}
                                    className="h-5 w-5 rounded text-primary focus:ring-primary border-gray-medium"
                                />
                                <span className="font-medium text-dark select-none">{category.title}</span>
                            </label>
                        ))}
                    </div>
                    <div className="pt-3 border-t border-gray-medium">
                         <button 
                            onClick={toggleSelectAll} 
                            className="w-full text-center text-sm font-semibold text-primary hover:underline">
                            {areAllSelected ? 'Deselect All' : 'Select All'}
                         </button>
                    </div>
                </div>
            )}

            {filteredCategories.length > 0 ? (
                filteredCategories.map(category => {
                    let tasksToRender: Task[] = [];
                    let isDisabled = false;

                    switch (category.id) {
                        case 'inter':
                            isDisabled = areInterstitialAdsExhausted || isInterCooldown;
                            const pendingInterstitialTasks = category.tasks.filter(t => t.status === 'pending');
                            tasksToRender = pendingInterstitialTasks.slice(0, INTERSTITIAL_BATCH_SIZE);
                            break;
                        case 'pop':
                            isDisabled = arePopAdsExhausted || isPopAdCooldown;
                            const pendingPopTasks = category.tasks.filter(t => t.status === 'pending');
                            tasksToRender = pendingPopTasks.slice(0, POP_ADS_BATCH_SIZE);
                            break;
                        case 'visit':
                             isDisabled = areVisitAdsExhausted || isVisitAdCooldown;
                            if (category.tasks.length > 0) {
                                const startIndex = visitAdState.completedTodayCount < VISIT_ADS_BATCH_SIZE ? 0 : VISIT_ADS_BATCH_SIZE;
                                const endIndex = startIndex + VISIT_ADS_BATCH_SIZE;
                                tasksToRender = category.tasks.slice(startIndex, endIndex);
                            }
                            break;
                        case 'website':
                            isDisabled = areWebsiteAdsExhausted || isWebsiteAdCooldown;
                            if (category.tasks.length > 0) {
                                const startIndex = Math.floor(websiteAdState.completedTodayCount / WEBSITE_ADS_BATCH_SIZE) * WEBSITE_ADS_BATCH_SIZE;
                                const endIndex = startIndex + WEBSITE_ADS_BATCH_SIZE;
                                tasksToRender = category.tasks.slice(startIndex, endIndex);
                            }
                            break;
                        case 'extra':
                            isDisabled = areExtraAdsExhausted || isExtraAdCooldown;
                            if (category.tasks.length > 0) {
                                const startIndex = Math.floor(extraAdState.completedTodayCount / EXTRA_ADS_BATCH_SIZE) * EXTRA_ADS_BATCH_SIZE;
                                const endIndex = startIndex + EXTRA_ADS_BATCH_SIZE;
                                tasksToRender = category.tasks.slice(startIndex, endIndex);
                            }
                            break;
                        default:
                            tasksToRender = category.tasks;
                            break;
                    }

                    return (
                        <div key={category.id} className="space-y-4 animate-fadeIn">
                            <div className="flex items-center justify-between gap-3">
                                <div className='flex items-center gap-3'>
                                    <span className={`w-2 h-6 rounded-full ${category.color}`}></span>
                                    <h3 className="text-lg font-bold text-dark">{category.title}</h3>
                                </div>
                                <div className="flex items-center gap-4">
                                    {category.id === 'pop' && (
                                        <div className="flex items-center gap-2">
                                            <span className={`font-semibold text-sm ${isAutoPopAdsRunning ? 'text-primary' : 'text-dark'}`}>Auto</span>
                                            <label htmlFor="auto-pop-toggle" className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    id="auto-pop-toggle"
                                                    className="sr-only peer"
                                                    checked={isAutoPopAdsRunning}
                                                    onChange={() => setIsAutoPopAdsRunning(prev => !prev)}
                                                    disabled={arePopAdsExhausted || isPopAdCooldown}
                                                />
                                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/50 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                            </label>
                                        </div>
                                    )}
                                   {renderCategoryStatus(category)}
                                </div>
                            </div>
                            <div className="space-y-3">
                                {tasksToRender.map(task => (
                                    <MiniTaskCard 
                                        key={task.id} 
                                        task={task} 
                                        onStartAd={onStartAd}
                                        taskType={category.id as any}
                                        disabled={isDisabled}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })
            ) : (
                <div className="text-center py-8 bg-white rounded-xl shadow-sm">
                    <p className="font-semibold text-gray">No categories selected.</p>
                    <p className="text-sm text-gray mt-1">Use the filter to show ad types.</p>
                </div>
            )}
        </div>
    );
};

export default TasksScreen;