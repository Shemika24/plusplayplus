import React from 'react';
import { CheckinState } from '../../types';

interface DailyCheckinModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCheckinAction: (isSurpriseBoxClaim: boolean) => void;
    checkinState: CheckinState;
    canClaimToday: boolean;
    isOnline: boolean; // NOVA PROP
}

const DailyCheckinModal: React.FC<DailyCheckinModalProps> = ({ isOpen, onClose, onCheckinAction, checkinState, canClaimToday, isOnline }) => {
    // const rewards = [25, 50, 75, 100, 125, 200, 500]; // Recompensas diárias não serão mais exibidas individualmente
    const SURPRISE_BOX_REWARD = 1500;
    const { claimedDays } = checkinState;
    
    if (!isOpen) return null;

    const showSurpriseBox = canClaimToday && claimedDays === 6; // Mostra a caixa de surpresa no dia 7 (claimedDays é 0-indexed)

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[100] animate-fadeIn" onClick={onClose}>
            <div className="bg-white p-6 rounded-2xl shadow-lg max-w-sm w-11/12 relative animate-slideInUp" onClick={e => e.stopPropagation()}>
                <button className="absolute top-4 right-4 text-gray hover:text-dark" onClick={onClose} aria-label="Close">
                    <i className="fa-solid fa-xmark text-2xl"></i>
                </button>
                <h2 className="text-2xl font-bold text-center text-dark mb-6">Daily Check-in</h2>
                <div className="grid grid-cols-4 gap-3 mb-6">
                    {Array.from({ length: 6 }).map((_, index) => { // Renderiza apenas os dias 1-6
                        const day = index + 1;
                        const isClaimed = day <= claimedDays;
                        const isNextDay = canClaimToday && day === claimedDays + 1;
                        
                        let cardClasses = 'bg-gray-light border-transparent';
                        if (isClaimed) cardClasses = 'bg-success/90 text-white border-success';
                        if (isNextDay) cardClasses = 'bg-primary/10 border-primary animate-pulse cursor-pointer hover:shadow-lg hover:-translate-y-0.5';

                        return (
                            <button
                                key={`day-${day}`}
                                className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all duration-200 ${cardClasses} disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:animate-none`}
                                onClick={() => onCheckinAction(false)}
                                disabled={!isNextDay || !isOnline} // DESABILITA SE ESTIVER OFFLINE
                                aria-label={isNextDay ? `Claim Day ${day} reward` : `Day ${day}`}
                            >
                                <span className={`text-xs font-medium ${isClaimed ? 'text-white/80' : 'text-gray'}`}>Day {day}</span>
                                <i className={`fa-solid fa-sun text-2xl my-1 ${isClaimed ? 'text-yellow-300' : isNextDay ? 'text-yellow-500' : 'text-gray-400'}`} />
                                {/* Remove a exibição de pontos aqui */}
                                {/* <span className={`font-bold text-sm ${isClaimed ? 'text-white' : 'text-dark'}`}>{rewards[index]} points</span> */}
                            </button>
                        );
                    })}

                    {/* Botão da Caixa de Surpresa para o 7º dia */}
                    <button
                        key="surprise-box"
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all duration-200 
                            ${showSurpriseBox ? 'bg-yellow-100 border-yellow-500 animate-pulse cursor-pointer hover:shadow-lg hover:-translate-y-0.5' :
                                claimedDays === 7 ? 'bg-success/90 text-white border-success' : // Se já reivindicado o 7º dia (esta condição nunca será verdadeira, pois claimedDays reseta para 0)
                                'bg-gray-light border-transparent disabled:opacity-70 disabled:cursor-not-allowed'
                            }`}
                        onClick={() => onCheckinAction(true)}
                        disabled={!showSurpriseBox || !isOnline} // DESABILITA SE ESTIVER OFFLINE
                        aria-label={showSurpriseBox ? "Claim Surprise Box reward" : "Surprise Box"}
                    >
                        <span className={`text-xs font-medium ${claimedDays === 7 ? 'text-white/80' : 'text-gray'}`}>Day 7</span>
                        <i className={`fa-solid fa-box-open text-2xl my-1 ${showSurpriseBox ? 'text-yellow-600' : claimedDays === 7 ? 'text-white' : 'text-gray-400'}`} />
                        {/* Remove a exibição de pontos/texto "Claimed" aqui, conforme solicitado */}
                        <span className={`font-bold text-sm ${claimedDays === 7 ? 'text-white' : 'text-dark'}`}>
                            &nbsp; {/* Um espaço vazio para manter o layout, mas sem texto de pontos/reivindicado */}
                        </span>
                    </button>
                </div>
                <p className="text-center text-gray text-sm mt-2 h-10 flex items-center justify-center px-4">
                    {canClaimToday 
                        ? (showSurpriseBox ? "Click on the Surprise Box to claim your bonus!" : "You haven't claimed today. Do it now by clicking on the day.") 
                        : "Come back tomorrow."}
                </p>
            </div>
        </div>
    );
};

export default DailyCheckinModal;