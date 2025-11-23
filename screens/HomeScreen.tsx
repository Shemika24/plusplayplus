
import React from 'react';
import { HomeScreenProps } from '../types';
import AdBanner from '../components/AdBanner';

interface BalanceCardProps {
  balance: number;
  onWithdrawClick: () => void;
}

const BalanceCard: React.FC<BalanceCardProps> = React.memo(({ balance, onWithdrawClick }) => {
  const points = React.useMemo(() => Math.floor(balance / 0.000001), [balance]);
  const progressPercentage = React.useMemo(() => Math.min((balance / 100) * 100, 100), [balance]);
  const canWithdraw = balance >= 5; // Minimum withdrawal is $5

  return (
    <div className="bg-gradient-to-br from-primary to-accent text-white rounded-3xl p-6 shadow-lg shadow-primary/30 text-center w-full mx-auto relative overflow-hidden">
      <button
        onClick={onWithdrawClick}
        disabled={!canWithdraw}
        aria-label="Go to withdrawal page"
        className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/20 flex items-center justify-center transition-all duration-200 hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white/20"
      >
        <i className="fa-solid fa-hand-holding-dollar text-3xl"></i>
      </button>

      <h2 className="text-sm font-medium text-white/80 mb-1">Balance</h2>
      <p className="text-5xl font-extrabold text-white tracking-tight">
        <span className="text-3xl font-semibold text-white/80 align-top mr-1">$</span>
        {balance.toFixed(2)}
      </p>
      <p className="text-base font-medium text-white/70 mb-6">{points.toLocaleString()} points</p>
      <div className="w-full bg-white/20 rounded-full h-2.5">
        <div className="bg-white h-2.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${progressPercentage}%` }}></div>
      </div>
    </div>
  );
});

interface TaskCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
  onClick: () => void;
  disabled?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = React.memo(({ icon, title, description, className, onClick, disabled = false }) => (
  <button 
    className={`rounded-2xl p-4 text-white text-left cursor-pointer transition-all duration-200 ease-in-out shadow-md hover:shadow-lg hover:-translate-y-1 flex flex-col justify-between min-h-[140px] ${className} ${disabled ? 'opacity-70 cursor-not-allowed hover:!translate-y-0' : ''}`}
    onClick={onClick}
    disabled={disabled}>
    <div className="text-4xl w-8 h-8 flex items-center justify-center">{icon}</div>
    <div>
      <h3 className="text-base font-bold">{title}</h3>
      <p className="text-xs opacity-80">{description}</p>
    </div>
  </button>
));

interface TaskGridProps {
  onOpenCheckin: () => void;
  onOpenSpinWheel: () => void;
  navigateToReferrals: () => void;
  startAutoAds: () => void;
  stopAutoAds: () => void;
  isAutoAdsRunning: boolean;
  isAutoAdsDisabled: boolean;
  isOnline: boolean;
}

const TaskGrid: React.FC<TaskGridProps> = ({ onOpenCheckin, onOpenSpinWheel, navigateToReferrals, startAutoAds, stopAutoAds, isAutoAdsRunning, isAutoAdsDisabled, isOnline }) => {
    
    const watchVideosCard = {
        id: 3,
        title: isAutoAdsRunning ? "Auto Ads Running" : "Watch Videos",
        description: isAutoAdsRunning ? "Click to stop session" : (isAutoAdsDisabled ? 'Limit reached for today' : 'Start auto-ad session'),
        icon: isAutoAdsRunning ? <i className="fa-solid fa-circle-stop"></i> : <i className="fa-solid fa-play"></i>,
        className: `bg-gradient-to-br from-red-500 to-orange-500 ${isAutoAdsRunning ? 'animate-pulse' : ''}`,
        action: isAutoAdsRunning ? stopAutoAds : startAutoAds,
        disabled: !isAutoAdsRunning && (isAutoAdsDisabled || !isOnline),
    };

    const tasks = [
        { id: 1, title: 'Daily Check-in', description: 'Claim your daily reward', icon: <i className="fa-solid fa-calendar-days"></i>, className: 'bg-gradient-to-br from-primary to-accent', action: onOpenCheckin, disabled: !isOnline },
        { id: 2, title: 'Lucky Wheel', description: 'Spin & Win', icon: <i className="fa-solid fa-trophy"></i>, className: 'bg-gradient-to-br from-secondary to-accent-secondary', action: onOpenSpinWheel, disabled: !isOnline },
        watchVideosCard,
        { id: 4, title: 'Play Games', description: 'Have Fun!', icon: <i className="fa-solid fa-gamepad"></i>, className: 'bg-gradient-to-br from-green-400 to-blue-500', action: () => alert('Task clicked: Play Games'), disabled: !isOnline },
        { id: 5, title: 'Invite Friends', description: 'Earn $0.10 + 10% for life!', icon: <i className="fa-solid fa-user-plus"></i>, className: 'bg-gradient-to-br from-yellow-400 to-orange-500', action: navigateToReferrals, disabled: false },
        { id: 6, title: 'Special Offers', description: 'Up to 1000 points', icon: <i className="fa-solid fa-gift"></i>, className: 'bg-gradient-to-br from-teal-400 to-cyan-500', action: () => alert('Task clicked: Special Offers'), disabled: !isOnline },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {tasks.map(task => <TaskCard key={task.id} title={task.title} description={task.description} icon={task.icon} className={task.className} onClick={task.action} disabled={task.disabled} />)}
        </div>
    );
};

const UniqueOfferCard: React.FC = () => {
  const [timeLeft, setTimeLeft] = React.useState(24 * 60 * 60);

  React.useEffect(() => {
    if (timeLeft <= 0) return;
    const timerId = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <div className="bg-gradient-to-r from-secondary to-accent-secondary rounded-2xl p-5 shadow-lg shadow-secondary/30 text-white flex items-center gap-4">
      <div className="flex-shrink-0 text-yellow-300"><i className="fa-solid fa-star text-4xl drop-shadow-lg"></i></div>
      <div className="flex-grow">
        <h3 className="font-bold text-lg">Unique Offer!</h3>
        <p className="text-sm opacity-90">Complete a special task and get <strong>$0.50 extra!</strong></p>
        <span className="text-xs font-medium bg-black/20 px-2 py-1 rounded-md mt-1 inline-block">Expires in: {formatTime(timeLeft)}</span>
      </div>
    </div>
  );
};

const HomeScreen: React.FC<HomeScreenProps> = ({ balance, onOpenCheckin, onOpenSpinWheel, navigateToWallet, navigateToReferrals, user, startAutoAds, stopAutoAds, isAutoAdsRunning, isAutoAdsDisabled, addTransaction, showTaskCompletion, isOnline }) => {
  
  const welcomeMessage = React.useMemo(() => {
    if (!user?.first_name) return "";
    const greetings = [
      `Olá, ${user.first_name}!`,
      `Bem-vindo de volta, ${user.first_name}!`,
      `Que bom te ver, ${user.first_name}!`
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }, [user]);

  return (
    <div className="space-y-6">
        <h1 id="welcome-message" className="text-2xl font-bold text-dark">{welcomeMessage}</h1>
        <BalanceCard balance={balance} onWithdrawClick={navigateToWallet} />
        <AdBanner />
        <div>
            <h2 className="text-xl font-bold text-dark mb-4">Your Tasks</h2>
            <TaskGrid 
              onOpenCheckin={onOpenCheckin} 
              onOpenSpinWheel={onOpenSpinWheel} 
              navigateToReferrals={navigateToReferrals} 
              startAutoAds={startAutoAds}
              stopAutoAds={stopAutoAds}
              isAutoAdsRunning={isAutoAdsRunning}
              isAutoAdsDisabled={isAutoAdsDisabled} 
              isOnline={isOnline}
            />
        </div>
        <UniqueOfferCard />
        <AdBanner />
    </div>
  );
};

export default HomeScreen;